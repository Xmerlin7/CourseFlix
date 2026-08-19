import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { DataSource } from 'typeorm';
import type {
  ExamLlmProvider,
  GeneratedQuestion,
} from '../adapters/exam-llm.adapter';
import { EXAM_LLM_PROVIDER } from '../adapters/exam-llm.adapter';
import {
  buildExamGenerationPrompt,
  type QuestionSpecItem,
} from '../prompt/exam-generation-prompt';
import {
  AgentFailure,
  AgentOutcome,
  AgentReporter,
  LessonAgent,
  LessonAgentContext,
} from './agent-context';
import type { LessonAgentKey } from './roster';

const MAX_TRANSCRIPT_CHARS = 40_000;

const TRUE_FALSE_OPTIONS = ['صح', 'خطأ'];

/**
 * Last agent, optional: sets a quiz on the lesson it just watched go by.
 *
 * It reuses `buildExamGenerationPrompt` and `EXAM_LLM_PROVIDER` rather
 * than growing a parallel quiz generator — the task is the same one
 * `ExamGenerationProcessor` performs, only scoped to a single lesson's
 * transcript and triggered by the pipeline instead of by a teacher's
 * explicit request.
 *
 * The quiz is written `pending_review`, so it stays invisible to
 * students until `LessonAgentsService.publishRun` publishes it — the
 * exact same gate manually-requested AI exams already pass through.
 */
@Injectable()
export class QuizmasterAgent implements LessonAgent {
  readonly key: LessonAgentKey = 'quizmaster';

  constructor(
    private readonly dataSource: DataSource,
    @Inject(EXAM_LLM_PROVIDER)
    private readonly llmProvider: ExamLlmProvider,
  ) {}

  async run(
    context: LessonAgentContext,
    reporter: AgentReporter,
  ): Promise<AgentOutcome> {
    const transcript = (context.transcriptText ?? '').slice(
      0,
      MAX_TRANSCRIPT_CHARS,
    );
    if (!transcript.trim()) {
      throw new AgentFailure('مفيش نص للدرس أبني عليه أسئلة.');
    }

    const settings = context.config.quiz;
    const questionSpec = this.buildSpec(settings.types, settings.questionCount);
    const feedback = await this.loadFeedbackThread(context.run.id);

    await reporter.progress(
      20,
      feedback.length > 0
        ? `بعيد صياغة الأسئلة ومعايا ${feedback.length} ملاحظة منك.`
        : `بصيغ ${settings.questionCount} سؤال مستوى "${settings.difficulty}".`,
    );

    const result = await this.llmProvider.generateExam({
      prompt: buildExamGenerationPrompt({
        content: transcript,
        difficulty: settings.difficulty,
        questionSpec,
        previousDraft: await this.loadPreviousDraft(context.run.id),
        feedback: feedback.length > 0 ? feedback : undefined,
      }),
      questionSpec,
      difficulty: settings.difficulty,
    });

    this.validate(result.questions, questionSpec);

    await reporter.progress(70, 'بحفظ الاختبار كمسودّة مستنية موافقتك.');

    const quizId = await this.persistDraft(context, result.questions);

    await reporter.progress(100);

    return {
      headline: `جهّزت ${result.questions.length} سؤال على الدرس، مستنية مراجعتك.`,
      output: {
        quizId,
        questions: result.questions.map((question) => ({
          type: question.type,
          text: question.text,
          options: question.options,
          correctAnswer: question.correctAnswer,
        })),
      },
    };
  }

  /**
   * The teacher picks a total and a set of types, not a per-type
   * breakdown, so the total is split as evenly as possible with the
   * remainder going to the earlier types — which keeps
   * `questionCount: 5, types: [mcq, true_false]` at 3 + 2 rather than
   * silently rounding to 4 or 6.
   */
  private buildSpec(
    types: Array<'mcq' | 'true_false'>,
    total: number,
  ): QuestionSpecItem[] {
    // Widened to a single concrete array type rather than a union with a
    // `readonly` tuple fallback — a union of array types degrades the
    // `.map` callback's parameter to `any`.
    const chosen: Array<'mcq' | 'true_false'> =
      types.length > 0 ? types : ['mcq'];
    const base = Math.floor(total / chosen.length);
    const remainder = total % chosen.length;

    return chosen
      .map((type, index) => ({
        type,
        count: base + (index < remainder ? 1 : 0),
      }))
      .filter((item) => item.count > 0);
  }

  /**
   * Same shape checks `ExamGenerationProcessor` applies — a draft that
   * silently disagrees with what the teacher asked for is worse than a
   * failure they can retry.
   */
  private validate(
    questions: GeneratedQuestion[],
    spec: QuestionSpecItem[],
  ): void {
    for (const item of spec) {
      const actual = questions.filter(
        (question) => question.type === item.type,
      ).length;
      if (actual !== item.count) {
        throw new AgentFailure(
          `طلعت ${actual} سؤال من نوع "${item.type}" بدل ${item.count} المطلوبين.`,
        );
      }
    }

    for (const question of questions) {
      if (!question.text?.trim()) {
        throw new AgentFailure('طلع سؤال من غير نص — جرّب تاني.');
      }
      if (!Array.isArray(question.options) || question.options.length < 2) {
        throw new AgentFailure(
          `السؤال "${question.text}" من غير اختيارات كافية.`,
        );
      }
      if (!question.options.includes(question.correctAnswer)) {
        throw new AgentFailure(
          `الإجابة الصحيحة للسؤال "${question.text}" مش موجودة ضمن الاختيارات.`,
        );
      }
    }
  }

  /**
   * A fresh quiz row per attempt: unlike exam generation — which keeps
   * one quiz and swaps its questions — a re-run here happens after
   * `LessonAgentsService` has already soft-removed the previous draft,
   * so there is nothing left to update in place.
   */
  private async persistDraft(
    context: LessonAgentContext,
    questions: GeneratedQuestion[],
  ): Promise<string> {
    const questionIds: string[] = [];
    for (const question of questions) {
      const id = randomUUID();
      await this.dataSource.query(
        `INSERT INTO questions (id, course_id, type, text, options, correct_answer, difficulty)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          id,
          context.course.id,
          question.type,
          question.text,
          question.type === 'true_false'
            ? TRUE_FALSE_OPTIONS
            : question.options,
          question.correctAnswer,
          question.difficulty,
        ],
      );
      questionIds.push(id);
    }

    const quizId = randomUUID();
    const dueAt = new Date(
      Date.now() + context.config.quiz.dueInDays * 24 * 60 * 60 * 1000,
    );

    await this.dataSource.query(
      `INSERT INTO quizzes (
        id, course_id, section_id, lesson_id, created_by, generation_type,
        title, status, due_at, version
      ) VALUES ($1, $2, $3, $4, NULL, 'rag_generated', $5, 'pending_review', $6, 1)`,
      [
        quizId,
        context.course.id,
        context.lesson.section_id,
        context.lesson.id,
        `اختبار درس: ${context.lesson.title}`,
        dueAt.toISOString(),
      ],
    );

    for (const [index, questionId] of questionIds.entries()) {
      await this.dataSource.query(
        `INSERT INTO quiz_questions (quiz_id, question_id, order_index) VALUES ($1, $2, $3)`,
        [quizId, questionId, index],
      );
    }

    return quizId;
  }

  // ── Revision context ──

  private async loadFeedbackThread(runId: string): Promise<string[]> {
    const rows = (await this.dataSource.query(
      `SELECT f.message
         FROM lesson_agent_step_feedback f
         JOIN lesson_agent_steps s ON s.id = f.step_id
        WHERE s.run_id = $1 AND s.agent_key = 'quizmaster'
        ORDER BY f.created_at ASC`,
      [runId],
    )) as unknown as Array<{ message: string }>;
    return rows.map((row) => row.message);
  }

  private async loadPreviousDraft(runId: string): Promise<
    | Array<{
        type: string;
        text: string;
        options: string[] | null;
        correctAnswer: string;
      }>
    | undefined
  > {
    const rows = (await this.dataSource.query(
      `SELECT output FROM lesson_agent_steps
        WHERE run_id = $1 AND agent_key = 'quizmaster'`,
      [runId],
    )) as unknown as Array<{
      output: {
        questions?: Array<{
          type: string;
          text: string;
          options: string[];
          correctAnswer: string;
        }>;
      } | null;
    }>;

    const questions = rows[0]?.output?.questions;
    return Array.isArray(questions) && questions.length > 0
      ? questions
      : undefined;
  }
}
