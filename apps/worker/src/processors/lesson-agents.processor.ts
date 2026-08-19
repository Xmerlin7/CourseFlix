import { Inject, Injectable, Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { DataSource } from 'typeorm';
import { ChromaAdapter } from '../adapters/chroma.adapter';
import { HandoutAgent } from '../agents/handout.agent';
import { IndexerAgent } from '../agents/indexer.agent';
import { NotifierAgent } from '../agents/notifier.agent';
import { QuizmasterAgent } from '../agents/quizmaster.agent';
import { ReviewerAgent } from '../agents/reviewer.agent';
import { TranscriptAgent } from '../agents/transcript.agent';
import {
  AgentFailure,
  AgentReporter,
  CourseRecord,
  LessonAgent,
  LessonAgentContext,
  LessonRecord,
  RunRecord,
  VideoRecord,
} from '../agents/agent-context';
import {
  AGENT_NAMES,
  AGENT_ORDER,
  LessonAgentKey,
  REVIEWABLE_AGENTS,
} from '../agents/roster';
import {
  DEFAULT_VIDEO_CHUNK_WORDS,
  DEFAULT_VIDEO_CHUNK_WORD_OVERLAP,
} from '../stages/caption-chunk.stage';
import type { NotificationProducerPort } from '../common/ports/notification-producer.port';
import { NOTIFICATION_PRODUCER_PORT } from '../common/ports/notification-producer.port';

export interface LessonAgentsJobPayload {
  jobId: string;
  /** Set when re-running a single agent after teacher feedback. */
  onlyAgentKey?: LessonAgentKey;
}

interface JobRecord {
  target_entity_type: string;
  target_entity_id: string;
}

interface StepRecord {
  id: string;
  agent_key: LessonAgentKey;
}

/** Turning any of these off would leave a lesson students can't ask about. */
const MANDATORY_AGENTS: readonly LessonAgentKey[] = [
  'transcript',
  'reviewer',
  'indexer',
];

/**
 * Orchestrates the multi-agent lesson pipeline.
 *
 * The agents run strictly in sequence, each one handing the next a
 * context the previous agent filled in — the indexer genuinely cannot
 * start before the transcriber has produced cues, which is what makes
 * the handoff narration the teacher watches an accurate description of
 * the work rather than decoration.
 *
 * Two failure policies, on purpose:
 *  - a **mandatory** agent failing ends the run, because everything
 *    after it depends on what it didn't produce;
 *  - an **optional** agent failing is recorded on its own step and the
 *    run carries on, so a handout the model fumbled never costs the
 *    teacher the quiz as well.
 *
 * A run only ever reaches `completed` through the teacher's publish
 * action in the API. The furthest this processor takes it is
 * `pending_review` — or straight to `completed` when no reviewable agent
 * produced anything, since then there is nothing to publish.
 */
@Processor('lesson-agents')
@Injectable()
export class LessonAgentsProcessor extends WorkerHost {
  private readonly logger = new Logger(LessonAgentsProcessor.name);
  private readonly agents: Record<LessonAgentKey, LessonAgent>;

  constructor(
    private readonly dataSource: DataSource,
    private readonly chromaAdapter: ChromaAdapter,
    transcriptAgent: TranscriptAgent,
    reviewerAgent: ReviewerAgent,
    indexerAgent: IndexerAgent,
    handoutAgent: HandoutAgent,
    quizmasterAgent: QuizmasterAgent,
    notifierAgent: NotifierAgent,
    @Inject(NOTIFICATION_PRODUCER_PORT)
    private readonly notificationProducer: NotificationProducerPort,
  ) {
    super();
    this.agents = {
      transcript: transcriptAgent,
      reviewer: reviewerAgent,
      indexer: indexerAgent,
      handout: handoutAgent,
      quizmaster: quizmasterAgent,
      notifier: notifierAgent,
    };
  }

  async process(job: Job<LessonAgentsJobPayload>): Promise<void> {
    const { jobId, onlyAgentKey } = job.data;
    this.logger.log(`[${job.id}] picked up ai_jobs row ${jobId}`);

    const claimed = await this.claim(jobId);
    if (!claimed) {
      this.logger.warn(
        `[${job.id}] ai_jobs row ${jobId} already claimed or completed — skipping`,
      );
      return;
    }

    let runId: string | null = null;

    try {
      const jobRecord = await this.getJobRecord(jobId);
      if (!jobRecord || jobRecord.target_entity_type !== 'lesson_agent_run') {
        throw new Error(`Invalid job target entity for ai_jobs row ${jobId}`);
      }

      runId = jobRecord.target_entity_id;
      await this.runPipeline(runId, onlyAgentKey);
      await this.markJobCompleted(jobId);

      this.logger.log(`[${job.id}] ai_jobs row ${jobId} (run ${runId}) → done`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(
        `[${job.id}] ai_jobs row ${jobId} → failed: ${message}`,
      );

      await this.markJobFailed(jobId, message);
      if (runId) {
        await this.failRun(runId, message);
      }

      throw err;
    }
  }

  // ---------------------------------------------------------------------------
  // Pipeline
  // ---------------------------------------------------------------------------

  private async runPipeline(
    runId: string,
    onlyAgentKey?: LessonAgentKey,
  ): Promise<void> {
    const context = await this.buildContext(runId);
    await this.markRunRunning(runId);

    const plan = onlyAgentKey
      ? [onlyAgentKey]
      : AGENT_ORDER.filter((key) => context.config.enabledAgents.includes(key));

    // A single-agent re-run skips the transcriber, so the writer or the
    // quizmaster would otherwise start with no material. The transcript
    // is rebuilt from the chunks the indexer already stored rather than
    // re-fetched, since the video hasn't changed — only the feedback has.
    if (onlyAgentKey && !plan.includes('transcript')) {
      await this.rehydrateTranscript(context);
    }

    let previousKey: LessonAgentKey | null = null;

    for (const agentKey of plan) {
      const step = await this.getStep(runId, agentKey);
      if (!step) {
        this.logger.warn(`run ${runId} has no step row for ${agentKey}`);
        continue;
      }

      if (previousKey) {
        await this.recordEvent(runId, {
          type: 'handoff',
          agentKey: previousKey,
          toAgentKey: agentKey,
          message: `${AGENT_NAMES[previousKey]} سلّم الشغل لـ${AGENT_NAMES[agentKey]}.`,
        });
      }

      const succeeded = await this.runAgent(runId, step, context);
      if (!succeeded && MANDATORY_AGENTS.includes(agentKey)) {
        // Everything downstream reads what this agent didn't produce.
        await this.recordEvent(runId, {
          type: 'run_failed',
          message: `الفريق وقف عند ${AGENT_NAMES[agentKey]} — مش هينفع نكمّل من غير شغله.`,
        });
        await this.finalizeRun(runId, context);
        return;
      }

      previousKey = agentKey;
    }

    await this.finalizeRun(runId, context);
  }

  /**
   * Runs one agent under the reporter it narrates through, and records
   * the result. Returns whether it succeeded, so the caller can apply
   * the mandatory/optional failure policy.
   */
  private async runAgent(
    runId: string,
    step: StepRecord,
    context: LessonAgentContext,
  ): Promise<boolean> {
    const agent = this.agents[step.agent_key];
    const name = AGENT_NAMES[step.agent_key];

    await this.markStepRunning(step.id);
    await this.recordEvent(runId, {
      type: 'agent_started',
      agentKey: step.agent_key,
      stepId: step.id,
      message: `${name} بدأ شغله.`,
    });

    const reporter = this.buildReporter(runId, step);

    try {
      const outcome = await agent.run(context, reporter);
      const reviewable = REVIEWABLE_AGENTS.includes(step.agent_key);

      await this.markStepCompleted(step.id, outcome, reviewable);
      await this.recordEvent(runId, {
        type: 'agent_completed',
        agentKey: step.agent_key,
        stepId: step.id,
        message: `${name}: ${outcome.headline}`,
      });

      if (reviewable) {
        await this.recordEvent(runId, {
          type: 'review_requested',
          agentKey: step.agent_key,
          stepId: step.id,
          message: `${name} مستني مراجعتك قبل ما ينشر.`,
        });
      }

      return true;
    } catch (err: unknown) {
      // An AgentFailure carries a message already written for the
      // teacher; anything else is an infrastructure fault whose raw
      // text would mean nothing to them.
      const message =
        err instanceof AgentFailure
          ? err.message
          : `حصلت مشكلة تقنية: ${err instanceof Error ? err.message : String(err)}`;

      await this.markStepFailed(step.id, message);
      await this.recordEvent(runId, {
        type: 'agent_failed',
        agentKey: step.agent_key,
        stepId: step.id,
        message: `${name} وقف: ${message}`,
      });

      this.logger.error(`run ${runId} agent ${step.agent_key}: ${message}`);
      return false;
    }
  }

  /**
   * The only channel an agent has to the outside world while it works.
   * Progress is clamped to 1–99 so a mid-flight update can never make a
   * step look finished before its result has actually been written.
   */
  private buildReporter(runId: string, step: StepRecord): AgentReporter {
    return {
      progress: async (percent: number, message?: string) => {
        await this.dataSource.query(
          `UPDATE lesson_agent_steps SET progress = $2, updated_at = NOW() WHERE id = $1`,
          [step.id, Math.max(1, Math.min(99, Math.round(percent)))],
        );
        if (message) {
          await this.recordEvent(runId, {
            type: 'agent_progress',
            agentKey: step.agent_key,
            stepId: step.id,
            message: `${AGENT_NAMES[step.agent_key]}: ${message}`,
          });
        }
      },
      note: async (message: string, metadata?: Record<string, unknown>) => {
        await this.recordEvent(runId, {
          type: 'agent_progress',
          agentKey: step.agent_key,
          stepId: step.id,
          message: `${AGENT_NAMES[step.agent_key]}: ${message}`,
          metadata,
        });
      },
    };
  }

  /**
   * Decides where a finished pass leaves the run.
   *
   * `completed` here only happens when no reviewable agent produced
   * anything — with both optional agents off, there is nothing for the
   * teacher to publish, so making them click "publish" on an empty
   * result would be busywork.
   */
  private async finalizeRun(
    runId: string,
    context: LessonAgentContext,
  ): Promise<void> {
    const steps = (await this.dataSource.query(
      `SELECT agent_key, status FROM lesson_agent_steps WHERE run_id = $1`,
      [runId],
    )) as unknown as Array<{ agent_key: LessonAgentKey; status: string }>;

    const mandatoryFailed = steps.some(
      (step) =>
        MANDATORY_AGENTS.includes(step.agent_key) && step.status === 'failed',
    );
    const reviewableProduced = steps.some(
      (step) =>
        REVIEWABLE_AGENTS.includes(step.agent_key) &&
        step.status === 'completed',
    );

    const status = mandatoryFailed
      ? 'failed'
      : reviewableProduced
        ? 'pending_review'
        : 'completed';

    await this.dataSource.query(
      `UPDATE lesson_agent_runs
          SET status = $2, finished_at = NOW(), updated_at = NOW()
        WHERE id = $1`,
      [runId, status],
    );

    if (status !== 'failed') {
      await this.recordEvent(runId, {
        type:
          status === 'pending_review' ? 'review_requested' : 'run_completed',
        message:
          status === 'pending_review'
            ? 'الفريق خلّص شغله — راجع اللي عملوه واعتمده.'
            : 'الفريق خلّص، والدرس بقى جاهز للطلاب.',
      });
    }

    await this.notifyTeacher(context, status);
  }

  private async notifyTeacher(
    context: LessonAgentContext,
    status: string,
  ): Promise<void> {
    const messages: Record<string, { title: string; message: string }> = {
      pending_review: {
        title: 'وكلاء الدرس خلّصوا شغلهم',
        message: `الفريق خلّص شغله على درس "${context.lesson.title}" — راجع اللي عملوه واعتمده.`,
      },
      completed: {
        title: 'وكلاء الدرس خلّصوا شغلهم',
        message: `درس "${context.lesson.title}" اتجهّز بالكامل وبقى جاهز للطلاب.`,
      },
      failed: {
        title: 'وكلاء الدرس وقفوا',
        message: `حصلت مشكلة وقفت الفريق على درس "${context.lesson.title}" — افتح التفاصيل تشوف مين وقف وليه.`,
      },
    };

    const payload = messages[status];
    if (!payload) return;

    await this.notificationProducer.notify({
      userId: context.run.teacher_id,
      type: 'lesson_agents_' + status,
      title: payload.title,
      message: payload.message,
      relatedEntityType: 'lesson_agent_run',
      relatedEntityId: context.run.id,
    });
  }

  // ---------------------------------------------------------------------------
  // Context
  // ---------------------------------------------------------------------------

  private async buildContext(runId: string): Promise<LessonAgentContext> {
    const runs = (await this.dataSource.query(
      `SELECT id, lesson_id, course_id, video_id, teacher_id, config
         FROM lesson_agent_runs WHERE id = $1`,
      [runId],
    )) as unknown as RunRecord[];
    const run = runs[0];
    if (!run) {
      throw new Error(`lesson_agent_run not found for ID ${runId}`);
    }

    const lessons = (await this.dataSource.query(
      `SELECT id, title, section_id, course_id FROM lessons WHERE id = $1`,
      [run.lesson_id],
    )) as unknown as LessonRecord[];
    if (!lessons[0]) {
      throw new Error(`Lesson not found for run ${runId}`);
    }

    const courses = (await this.dataSource.query(
      `SELECT id, title, teacher_id FROM courses WHERE id = $1`,
      [run.course_id],
    )) as unknown as CourseRecord[];
    if (!courses[0]) {
      throw new Error(`Course not found for run ${runId}`);
    }

    // `video_id` can be null if the run was created before the lesson's
    // video row finished syncing, so fall back to the lesson's video.
    const videos = (await this.dataSource.query(
      run.video_id
        ? `SELECT id, title, video_url FROM videos WHERE id = $1 AND deleted_at IS NULL`
        : `SELECT id, title, video_url FROM videos WHERE lesson_id = $1 AND deleted_at IS NULL LIMIT 1`,
      [run.video_id ?? run.lesson_id],
    )) as unknown as VideoRecord[];
    if (!videos[0]) {
      throw new Error(`No video attached to lesson ${run.lesson_id}`);
    }

    return {
      run,
      lesson: lessons[0],
      course: courses[0],
      video: videos[0],
      config: run.config,
    };
  }

  /**
   * Rebuilds the lesson transcript from the chunks the indexer stored,
   * for a re-run that skips the transcriber.
   *
   * `chunkCaptions` writes fixed overlapping windows, so consecutive
   * chunks repeat their last `DEFAULT_VIDEO_CHUNK_WORD_OVERLAP` words.
   * Taking only the first `stride` words of every chunk but the last
   * reverses that exactly, which is why the constants are imported
   * rather than restated — if the chunker's windowing changes, this
   * follows it instead of silently producing a stuttering transcript.
   */
  private async rehydrateTranscript(
    context: LessonAgentContext,
  ): Promise<void> {
    const transcripts = (await this.dataSource.query(
      `SELECT id, version FROM video_transcripts WHERE video_id = $1`,
      [context.video.id],
    )) as unknown as Array<{ id: string; version: number }>;
    if (!transcripts[0]) return;

    context.videoTranscriptId = transcripts[0].id;
    context.transcriptVersion = Number(transcripts[0].version);

    const chunkRows = (await this.dataSource.query(
      `SELECT vector_id FROM video_chunks
        WHERE video_transcript_id = $1 AND is_active = true
        ORDER BY chunk_index`,
      [transcripts[0].id],
    )) as unknown as Array<{ vector_id: string }>;
    if (chunkRows.length === 0) return;

    const collection = await this.chromaAdapter.getCollection();
    const fetched = (await collection.get({
      ids: chunkRows.map((row) => row.vector_id),
    })) as unknown as { ids?: string[]; documents?: (string | null)[] };

    // Chroma does not promise to return ids in the order they were
    // asked for, so the texts are re-sorted against the id order the
    // chunk_index query established.
    const byId = new Map<string, string>();
    (fetched.ids ?? []).forEach((id, index) => {
      const text = fetched.documents?.[index];
      if (text) byId.set(id, text);
    });

    const ordered = chunkRows
      .map((row) => byId.get(row.vector_id))
      .filter((text): text is string => Boolean(text));
    if (ordered.length === 0) return;

    const stride = DEFAULT_VIDEO_CHUNK_WORDS - DEFAULT_VIDEO_CHUNK_WORD_OVERLAP;

    const words: string[] = [];
    ordered.forEach((text, index) => {
      const chunkWords = text.split(/\s+/).filter(Boolean);
      words.push(
        ...(index === ordered.length - 1
          ? chunkWords
          : chunkWords.slice(0, stride)),
      );
    });

    context.transcriptText = words.join(' ');
  }

  // ---------------------------------------------------------------------------
  // SQL helpers
  // ---------------------------------------------------------------------------

  private async claim(jobId: string): Promise<boolean> {
    const rows = (await this.dataSource.query(
      `UPDATE ai_jobs
          SET status = 'processing', started_at = NOW()
        WHERE id = $1
          AND status IN ('queued', 'failed')
        RETURNING id`,
      [jobId],
    )) as unknown as Array<{ id: string }>;
    return rows.length > 0;
  }

  private async getJobRecord(jobId: string): Promise<JobRecord | null> {
    const rows = (await this.dataSource.query(
      `SELECT target_entity_type, target_entity_id FROM ai_jobs WHERE id = $1`,
      [jobId],
    )) as unknown as JobRecord[];
    return rows[0] || null;
  }

  private async getStep(
    runId: string,
    agentKey: LessonAgentKey,
  ): Promise<StepRecord | null> {
    const rows = (await this.dataSource.query(
      `SELECT id, agent_key FROM lesson_agent_steps
        WHERE run_id = $1 AND agent_key = $2`,
      [runId, agentKey],
    )) as unknown as StepRecord[];
    return rows[0] || null;
  }

  private async markRunRunning(runId: string): Promise<void> {
    await this.dataSource.query(
      `UPDATE lesson_agent_runs
          SET status = 'running',
              started_at = COALESCE(started_at, NOW()),
              error_message = NULL,
              updated_at = NOW()
        WHERE id = $1`,
      [runId],
    );
  }

  private async failRun(runId: string, message: string): Promise<void> {
    await this.dataSource.query(
      `UPDATE lesson_agent_runs
          SET status = 'failed', error_message = $2, finished_at = NOW(), updated_at = NOW()
        WHERE id = $1`,
      [runId, message],
    );
  }

  private async markStepRunning(stepId: string): Promise<void> {
    await this.dataSource.query(
      `UPDATE lesson_agent_steps
          SET status = 'running', progress = 1, started_at = NOW(),
              finished_at = NULL, error_message = NULL, updated_at = NOW()
        WHERE id = $1`,
      [stepId],
    );
  }

  private async markStepCompleted(
    stepId: string,
    outcome: { headline: string; output: Record<string, unknown> },
    reviewable: boolean,
  ): Promise<void> {
    await this.dataSource.query(
      `UPDATE lesson_agent_steps
          SET status = 'completed', progress = 100, headline = $2, output = $3,
              review_status = $4, finished_at = NOW(), updated_at = NOW()
        WHERE id = $1`,
      [
        stepId,
        outcome.headline,
        JSON.stringify(outcome.output),
        reviewable ? 'pending' : 'not_required',
      ],
    );
  }

  private async markStepFailed(stepId: string, message: string): Promise<void> {
    await this.dataSource.query(
      `UPDATE lesson_agent_steps
          SET status = 'failed', error_message = $2, finished_at = NOW(), updated_at = NOW()
        WHERE id = $1`,
      [stepId, message],
    );
  }

  private async recordEvent(
    runId: string,
    event: {
      type: string;
      message: string;
      agentKey?: LessonAgentKey;
      toAgentKey?: LessonAgentKey;
      stepId?: string;
      metadata?: Record<string, unknown>;
    },
  ): Promise<void> {
    await this.dataSource.query(
      `INSERT INTO lesson_agent_events (
        run_id, step_id, agent_key, to_agent_key, type, message, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        runId,
        event.stepId ?? null,
        event.agentKey ?? null,
        event.toAgentKey ?? null,
        event.type,
        event.message,
        event.metadata ? JSON.stringify(event.metadata) : null,
      ],
    );
  }

  private async markJobCompleted(jobId: string): Promise<void> {
    await this.dataSource.query(
      `UPDATE ai_jobs SET status = 'completed', finished_at = NOW() WHERE id = $1`,
      [jobId],
    );
  }

  private async markJobFailed(
    jobId: string,
    errorMessage: string,
  ): Promise<void> {
    await this.dataSource.query(
      `UPDATE ai_jobs
          SET status = 'failed', finished_at = NOW(), error_message = $2, retries = retries + 1
        WHERE id = $1`,
      [jobId, errorMessage],
    );
  }
}
