import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  AGENT_LOG_PORT,
  AgentLogPort,
} from '../../common/ports/agent-log.port';
import { SubmitMiniQuizDto } from './dto/submit-mini-quiz.dto';
import { InterventionMiniQuizQuestionEntity } from './entities/intervention-mini-quiz-question.entity';
import { InterventionMiniQuizEntity } from './entities/intervention-mini-quiz.entity';
import { InterventionEntity } from './entities/intervention.entity';

/** Deterministic fallback question bank. Never empty, never stores raw user text. */
const FALLBACK_QUESTIONS: Array<{
  text: string;
  type: 'mcq' | 'true_false';
  options: string[];
  correctAnswer: string;
}> = [
  {
    text: 'ما هو القانون الأساسي المتعلق بهذه المفاهيم؟',
    type: 'mcq',
    options: ['قانون أول', 'قانون ثاني', 'قانون ثالث', 'لا شيء مما سبق'],
    correctAnswer: 'قانون أول',
  },
  {
    text: 'هل هذه المفاهيم مترابطة في الفيزياء؟',
    type: 'true_false',
    options: ['صح', 'خطأ'],
    correctAnswer: 'صح',
  },
  {
    text: 'أي من التالي يمثل تطبيقاً عملياً لهذه المفاهيم؟',
    type: 'mcq',
    options: [
      'الحركة اليومية',
      'السكون التام',
      'الانحلال الذري',
      'الانبعاث الضوئي',
    ],
    correctAnswer: 'الحركة اليومية',
  },
];

@Injectable()
export class MiniQuizService {
  private readonly logger = new Logger(MiniQuizService.name);

  constructor(
    @InjectRepository(InterventionMiniQuizEntity)
    private readonly miniQuizRepo: Repository<InterventionMiniQuizEntity>,
    @InjectRepository(InterventionMiniQuizQuestionEntity)
    private readonly questionRepo: Repository<InterventionMiniQuizQuestionEntity>,
    @InjectRepository(InterventionEntity)
    private readonly interventionRepo: Repository<InterventionEntity>,
    @Inject(AGENT_LOG_PORT)
    private readonly agentLogPort: AgentLogPort,
  ) {}

  /**
   * Generate a 3-question mini-quiz for an intervention and stamp
   * `interventions.mini_quiz_id`. Must never throw into the caller —
   * a mini-quiz failure should not roll back an already-committed
   * intervention.
   */
  async generateForIntervention(
    intervention: InterventionEntity,
  ): Promise<void> {
    try {
      const miniQuiz = await this.miniQuizRepo.save(
        this.miniQuizRepo.create({
          interventionId: intervention.id,
          courseId: intervention.courseId,
          studentId: intervention.studentId,
          weakConcept: intervention.weakConcept,
          status: 'active',
        }),
      );

      await this.questionRepo.save(
        FALLBACK_QUESTIONS.map((q, i) =>
          this.questionRepo.create({
            miniQuizId: miniQuiz.id,
            text: q.text,
            type: q.type,
            options: q.options,
            correctAnswer: q.correctAnswer,
            orderIndex: i,
          }),
        ),
      );

      await this.interventionRepo.update(intervention.id, {
        miniQuizId: miniQuiz.id,
      });

      await this.agentLogPort.record({
        agentType: 'proactive_proctor',
        action: 'mini_quiz.generated',
        status: 'success',
        courseId: intervention.courseId,
        targetEntityType: 'intervention',
        targetEntityId: intervention.id,
        metadata: {
          ruleKey: intervention.ruleKey,
          questionCount: FALLBACK_QUESTIONS.length,
        },
      });

      this.logger.log(
        `Mini quiz ${miniQuiz.id} generated for intervention ${intervention.id}`,
      );
    } catch (error) {
      this.logger.warn(
        `Mini-quiz generation failed for intervention=${intervention.id}: ${String(error)}`,
      );
    }
  }

  async getForStudent(
    miniQuizId: string,
    studentId: string,
  ): Promise<{
    id: string;
    weakConcept: string;
    status: string;
    score: number | null;
    total: number | null;
    questions: Array<{
      id: string;
      type: string;
      text: string;
      options: string[] | null;
    }>;
  }> {
    const quiz = await this.miniQuizRepo.findOne({ where: { id: miniQuizId } });
    if (!quiz || quiz.studentId !== studentId) {
      throw new NotFoundException('Mini quiz not found');
    }

    const questions = await this.questionRepo.find({
      where: { miniQuizId },
      order: { orderIndex: 'ASC' },
    });

    return {
      id: quiz.id,
      weakConcept: quiz.weakConcept,
      status: quiz.status,
      score: quiz.score,
      total: quiz.total,
      questions: questions.map((q) => ({
        id: q.id,
        type: q.type,
        text: q.text,
        options: q.options,
      })),
    };
  }

  async submit(
    miniQuizId: string,
    studentId: string,
    dto: SubmitMiniQuizDto,
  ): Promise<{
    score: number;
    total: number;
    answers: Array<{ questionId: string; isCorrect: boolean }>;
  }> {
    const quiz = await this.miniQuizRepo.findOne({ where: { id: miniQuizId } });
    if (!quiz || quiz.studentId !== studentId) {
      throw new NotFoundException('Mini quiz not found');
    }
    if (quiz.status === 'completed') {
      throw new NotFoundException('Mini quiz already submitted');
    }

    const questions = await this.questionRepo.find({
      where: { miniQuizId },
      order: { orderIndex: 'ASC' },
    });
    const questionMap = new Map(questions.map((q) => [q.id, q]));

    let score = 0;
    const answers = dto.answers.map((answer) => {
      const question = questionMap.get(answer.questionId);
      const isCorrect = question?.correctAnswer === answer.selectedAnswer;
      if (isCorrect) score++;
      return { questionId: answer.questionId, isCorrect: isCorrect ?? false };
    });

    await this.miniQuizRepo.update(miniQuizId, {
      status: 'completed',
      score,
      total: questions.length,
    });

    await this.agentLogPort.record({
      agentType: 'proactive_proctor',
      action: 'mini_quiz.submitted',
      status: 'success',
      courseId: quiz.courseId,
      targetEntityType: 'intervention_mini_quiz',
      targetEntityId: quiz.id,
      metadata: { score, total: questions.length },
    });

    return { score, total: questions.length, answers };
  }
}
