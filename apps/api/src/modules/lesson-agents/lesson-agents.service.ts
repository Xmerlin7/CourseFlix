import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, IsNull, Repository } from 'typeorm';
import {
  NOTIFICATION_PRODUCER_PORT,
  NotificationProducerPort,
} from '../../common/ports/notification-producer.port';
import { CourseEntity } from '../courses/entities/course.entity';
import { LessonEntity } from '../courses/entities/lesson.entity';
import { DocumentEntity } from '../documents/entities/document.entity';
import { EnrollmentsService } from '../enrollments/enrollments.service';
import { JobsService } from '../jobs/jobs.service';
import { VideoEntity } from '../lessons/entities/video.entity';
import { QuizEntity } from '../quizzes/entities/quiz.entity';
import { StartLessonAgentRunDto } from './dto/start-lesson-agent-run.dto';
import { UpdateAgentSettingsDto } from './dto/update-agent-settings.dto';
import { LessonAgentEventEntity } from './entities/lesson-agent-event.entity';
import {
  LessonAgentRunEntity,
  LessonAgentRunStatus,
} from './entities/lesson-agent-run.entity';
import { LessonAgentStepFeedbackEntity } from './entities/lesson-agent-step-feedback.entity';
import {
  LessonAgentStepEntity,
  LessonAgentStepOutput,
} from './entities/lesson-agent-step.entity';
import { TeacherAgentSettingsEntity } from './entities/teacher-agent-settings.entity';
import {
  AGENT_BY_KEY,
  AGENT_ROSTER,
  LessonAgentKey,
  LessonAgentRunConfig,
} from './lesson-agents.constants';

export interface AgentSettingsResponse {
  handoutEnabled: boolean;
  handoutPageCount: number;
  handoutTone: string;
  handoutIncludeExamples: boolean;
  handoutIncludeKeyTerms: boolean;
  handoutIncludeSummary: boolean;
  quizEnabled: boolean;
  quizDifficulty: string;
  quizQuestionCount: number;
  quizTypes: string[];
  quizDueInDays: number;
}

export interface LessonAgentStepResponse {
  id: string;
  agentKey: LessonAgentKey;
  name: string;
  role: string;
  icon: string;
  mandatory: boolean;
  reviewable: boolean;
  orderIndex: number;
  status: string;
  reviewStatus: string;
  progress: number;
  headline: string | null;
  output: LessonAgentStepOutput | null;
  errorMessage: string | null;
  attempt: number;
  startedAt: string | null;
  finishedAt: string | null;
  feedback: Array<{ id: string; message: string; createdAt: string }>;
}

export interface LessonAgentRunSummary {
  id: string;
  lessonId: string;
  courseId: string;
  status: LessonAgentRunStatus;
  progress: number;
  errorMessage: string | null;
  createdAt: string;
  finishedAt: string | null;
}

export interface LessonAgentRunDetail extends LessonAgentRunSummary {
  lessonTitle: string;
  config: LessonAgentRunConfig;
  startedAt: string | null;
  canPublish: boolean;
  steps: LessonAgentStepResponse[];
  events: Array<{
    id: string;
    type: string;
    agentKey: LessonAgentKey | null;
    toAgentKey: LessonAgentKey | null;
    message: string;
    metadata: Record<string, unknown> | null;
    createdAt: string;
  }>;
}

/**
 * Defaults for a teacher who has never touched the settings form. Kept
 * in code rather than seeded as a row on signup so changing them here
 * changes them for every such teacher without a backfill — the row is
 * only written once the teacher actually saves a preference.
 */
const DEFAULT_SETTINGS: AgentSettingsResponse = {
  handoutEnabled: true,
  handoutPageCount: 4,
  handoutTone: 'simple',
  handoutIncludeExamples: true,
  handoutIncludeKeyTerms: true,
  handoutIncludeSummary: true,
  quizEnabled: true,
  quizDifficulty: 'medium',
  quizQuestionCount: 8,
  quizTypes: ['mcq', 'true_false'],
  quizDueInDays: 7,
};

/** A run in one of these is still owned by the worker — don't touch it. */
const IN_FLIGHT_STATUSES: LessonAgentRunStatus[] = ['queued', 'running'];

@Injectable()
export class LessonAgentsService {
  private readonly logger = new Logger(LessonAgentsService.name);

  constructor(
    @InjectRepository(LessonAgentRunEntity)
    private readonly runsRepo: Repository<LessonAgentRunEntity>,
    @InjectRepository(LessonAgentStepEntity)
    private readonly stepsRepo: Repository<LessonAgentStepEntity>,
    @InjectRepository(LessonAgentEventEntity)
    private readonly eventsRepo: Repository<LessonAgentEventEntity>,
    @InjectRepository(LessonAgentStepFeedbackEntity)
    private readonly feedbackRepo: Repository<LessonAgentStepFeedbackEntity>,
    @InjectRepository(TeacherAgentSettingsEntity)
    private readonly settingsRepo: Repository<TeacherAgentSettingsEntity>,
    @InjectRepository(LessonEntity)
    private readonly lessonsRepo: Repository<LessonEntity>,
    @InjectRepository(CourseEntity)
    private readonly coursesRepo: Repository<CourseEntity>,
    @InjectRepository(VideoEntity)
    private readonly videosRepo: Repository<VideoEntity>,
    @InjectRepository(DocumentEntity)
    private readonly documentsRepo: Repository<DocumentEntity>,
    @InjectRepository(QuizEntity)
    private readonly quizzesRepo: Repository<QuizEntity>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly jobsService: JobsService,
    private readonly enrollmentsService: EnrollmentsService,
    @Inject(NOTIFICATION_PRODUCER_PORT)
    private readonly notificationProducer: NotificationProducerPort,
  ) {}

  // ── Settings ──

  async getSettings(teacherId: string): Promise<AgentSettingsResponse> {
    const row = await this.settingsRepo.findOne({ where: { teacherId } });
    if (!row) {
      return { ...DEFAULT_SETTINGS };
    }
    return {
      handoutEnabled: row.handoutEnabled,
      handoutPageCount: row.handoutPageCount,
      handoutTone: row.handoutTone,
      handoutIncludeExamples: row.handoutIncludeExamples,
      handoutIncludeKeyTerms: row.handoutIncludeKeyTerms,
      handoutIncludeSummary: row.handoutIncludeSummary,
      quizEnabled: row.quizEnabled,
      quizDifficulty: row.quizDifficulty,
      quizQuestionCount: row.quizQuestionCount,
      quizTypes: row.quizTypes,
      quizDueInDays: row.quizDueInDays,
    };
  }

  /**
   * Merge-on-write, like `UsersService.updateSettings`: a PATCH carrying
   * one field must not reset the other eleven to their defaults.
   */
  async updateSettings(
    teacherId: string,
    dto: UpdateAgentSettingsDto,
  ): Promise<AgentSettingsResponse> {
    const current = await this.getSettings(teacherId);
    const merged = { ...current, ...this.stripUndefined(dto) };

    await this.settingsRepo.save(
      this.settingsRepo.create({
        teacherId,
        handoutEnabled: merged.handoutEnabled,
        handoutPageCount: merged.handoutPageCount,
        handoutTone: merged.handoutTone as never,
        handoutIncludeExamples: merged.handoutIncludeExamples,
        handoutIncludeKeyTerms: merged.handoutIncludeKeyTerms,
        handoutIncludeSummary: merged.handoutIncludeSummary,
        quizEnabled: merged.quizEnabled,
        quizDifficulty: merged.quizDifficulty as never,
        quizQuestionCount: merged.quizQuestionCount,
        quizTypes: merged.quizTypes as never,
        quizDueInDays: merged.quizDueInDays,
      }),
    );

    return merged;
  }

  // ── Runs ──

  /**
   * Kicks off the pipeline for one lesson.
   *
   * The lesson must already have a video: every downstream agent reads
   * from the transcript, so starting without one would queue a crew with
   * nothing to work on and fail three steps in for a reason the teacher
   * could have been told up front.
   */
  async startRun(
    lessonId: string,
    teacherId: string,
    dto: StartLessonAgentRunDto = {},
  ): Promise<LessonAgentRunDetail> {
    const lesson = await this.loadOwnedLesson(lessonId, teacherId);

    const video = await this.videosRepo.findOne({
      where: { lessonId: lesson.id, deletedAt: IsNull() },
    });
    if (!video) {
      throw new BadRequestException(
        'الدرس لازم يكون فيه رابط فيديو قبل ما تشغّل الوكلاء.',
      );
    }

    const inFlight = await this.runsRepo.findOne({
      where: { lessonId: lesson.id, status: In(IN_FLIGHT_STATUSES) },
    });
    if (inFlight) {
      throw new ConflictException('في وكلاء شغالين على الدرس ده بالفعل.');
    }

    const settings = await this.getSettings(teacherId);
    const merged = { ...settings, ...this.stripUndefined(dto.overrides ?? {}) };
    const config = this.toRunConfig(merged);

    const run = await this.runsRepo.save(
      this.runsRepo.create({
        lessonId: lesson.id,
        courseId: lesson.courseId,
        videoId: video.id,
        teacherId,
        status: 'queued',
        config,
      }),
    );

    await this.seedSteps(run.id, config);
    await this.recordEvent(run.id, {
      type: 'run_started',
      message: `الفريق استلم درس "${lesson.title}" وبدأ الشغل.`,
      metadata: { enabledAgents: config.enabledAgents },
    });

    await this.jobsService.enqueueLessonAgents(run.id);

    return this.getRun(run.id, teacherId);
  }

  async listRunsForCourse(
    courseId: string,
    teacherId: string,
  ): Promise<LessonAgentRunSummary[]> {
    await this.assertTeacherOwnsCourse(courseId, teacherId);

    const runs = await this.runsRepo.find({
      where: { courseId },
      order: { createdAt: 'DESC' },
    });
    if (runs.length === 0) return [];

    const steps = await this.stepsRepo.find({
      where: { runId: In(runs.map((run) => run.id)) },
    });

    return runs.map((run) =>
      this.toSummary(
        run,
        steps.filter((step) => step.runId === run.id),
      ),
    );
  }

  async getRun(
    runId: string,
    teacherId: string,
  ): Promise<LessonAgentRunDetail> {
    const run = await this.loadOwnedRun(runId, teacherId);

    const [lesson, steps, events] = await Promise.all([
      this.lessonsRepo.findOne({ where: { id: run.lessonId } }),
      this.stepsRepo.find({
        where: { runId: run.id },
        order: { orderIndex: 'ASC' },
      }),
      this.eventsRepo.find({
        where: { runId: run.id },
        order: { createdAt: 'ASC' },
      }),
    ]);

    const feedback =
      steps.length > 0
        ? await this.feedbackRepo.find({
            where: { stepId: In(steps.map((step) => step.id)) },
            order: { createdAt: 'ASC' },
          })
        : [];

    return {
      ...this.toSummary(run, steps),
      lessonTitle: lesson?.title ?? '',
      config: run.config,
      startedAt: run.startedAt?.toISOString() ?? null,
      canPublish: this.canPublish(run, steps),
      steps: steps.map((step) =>
        this.toStepResponse(
          step,
          feedback.filter((entry) => entry.stepId === step.id),
        ),
      ),
      events: events.map((event) => ({
        id: event.id,
        type: event.type,
        agentKey: event.agentKey,
        toAgentKey: event.toAgentKey,
        message: event.message,
        metadata: event.metadata,
        createdAt: event.createdAt.toISOString(),
      })),
    };
  }

  // ── Step review ──

  async approveStep(
    runId: string,
    stepId: string,
    teacherId: string,
  ): Promise<LessonAgentRunDetail> {
    const { run, step } = await this.loadReviewableStep(
      runId,
      stepId,
      teacherId,
    );

    step.reviewStatus = 'approved';
    await this.stepsRepo.save(step);
    await this.recordEvent(run.id, {
      stepId: step.id,
      agentKey: step.agentKey,
      type: 'teacher_approved',
      message: `المدرس وافق على شغل ${AGENT_BY_KEY[step.agentKey].name}.`,
    });

    return this.getRun(run.id, teacherId);
  }

  /**
   * Rejection discards the artifact immediately rather than deferring to
   * publish — same call as `ExamGenerationService.reject`, and it keeps
   * a rejected draft from lingering as a soft-deleted-but-present quiz
   * or an orphan PDF nobody will ever approve.
   */
  async rejectStep(
    runId: string,
    stepId: string,
    teacherId: string,
  ): Promise<LessonAgentRunDetail> {
    const { run, step } = await this.loadReviewableStep(
      runId,
      stepId,
      teacherId,
    );

    await this.discardStepArtifact(step);

    step.reviewStatus = 'rejected';
    await this.stepsRepo.save(step);
    await this.recordEvent(run.id, {
      stepId: step.id,
      agentKey: step.agentKey,
      type: 'teacher_rejected',
      message: `المدرس رفض شغل ${AGENT_BY_KEY[step.agentKey].name} واتشال.`,
    });

    return this.getRun(run.id, teacherId);
  }

  /**
   * The "redo just this one" path. The teacher's note is appended to the
   * step's thread, the artifact from the previous attempt is discarded,
   * and only that agent is re-queued — the transcript and the index it
   * built are not re-derived just because the handout read badly.
   */
  async sendStepFeedback(
    runId: string,
    stepId: string,
    teacherId: string,
    message: string,
  ): Promise<LessonAgentRunDetail> {
    const { run, step } = await this.loadReviewableStep(
      runId,
      stepId,
      teacherId,
    );

    await this.feedbackRepo.save(
      this.feedbackRepo.create({ stepId: step.id, message: message.trim() }),
    );
    await this.discardStepArtifact(step);

    step.reviewStatus = 'revision_requested';
    step.status = 'pending';
    step.progress = 0;
    step.attempt += 1;
    step.output = null;
    step.headline = null;
    step.errorMessage = null;
    step.startedAt = null;
    step.finishedAt = null;
    await this.stepsRepo.save(step);

    run.status = 'running';
    run.finishedAt = null;
    run.errorMessage = null;
    await this.runsRepo.save(run);

    await this.recordEvent(run.id, {
      stepId: step.id,
      agentKey: step.agentKey,
      type: 'teacher_feedback',
      message: `المدرس طلب تعديل من ${AGENT_BY_KEY[step.agentKey].name}: "${message.trim()}"`,
      metadata: { attempt: step.attempt },
    });

    await this.jobsService.enqueueLessonAgents(run.id, step.agentKey);

    return this.getRun(run.id, teacherId);
  }

  // ── Publish ──

  /**
   * Turns every approved draft into published content in one action, so
   * the teacher makes the "students can see this now" decision once
   * instead of per artifact.
   */
  async publishRun(
    runId: string,
    teacherId: string,
  ): Promise<LessonAgentRunDetail> {
    const run = await this.loadOwnedRun(runId, teacherId);
    if (run.status !== 'pending_review') {
      throw new ConflictException('التشغيلة دي مش جاهزة للنشر.');
    }

    const steps = await this.stepsRepo.find({ where: { runId: run.id } });
    if (!this.canPublish(run, steps)) {
      throw new ConflictException(
        'لسه في شغل مستني مراجعتك — راجع كل الوكلاء الأول.',
      );
    }

    for (const step of steps) {
      if (step.reviewStatus !== 'approved') continue;
      if (step.agentKey === 'handout') {
        await this.publishHandout(step.output);
      }
      if (step.agentKey === 'quizmaster') {
        await this.publishQuiz(run.courseId, step.output);
      }
    }

    run.status = 'completed';
    run.finishedAt = new Date();
    await this.runsRepo.save(run);

    await this.recordEvent(run.id, {
      type: 'run_completed',
      message: 'المدرس نشر شغل الفريق — بقى متاح للطلاب.',
    });

    return this.getRun(run.id, teacherId);
  }

  // ── Private: publishing ──

  private async publishHandout(
    output: LessonAgentStepOutput | null,
  ): Promise<void> {
    const documentId = output?.documentId;
    if (!documentId) return;

    await this.documentsRepo.update(documentId, { isAgentDraft: false });

    // The chunks were embedded into Chroma at generation time but parked
    // inactive in Postgres, which is where `RetrievalService` gates —
    // flipping them here is what actually lets the tutor cite the
    // handout, with no re-embedding.
    await this.dataSource.query(
      `UPDATE document_chunks SET is_active = true WHERE document_id = $1`,
      [documentId],
    );
  }

  private async publishQuiz(
    courseId: string,
    output: LessonAgentStepOutput | null,
  ): Promise<void> {
    const quizId = output?.quizId;
    if (!quizId) return;

    const quiz = await this.quizzesRepo.findOne({ where: { id: quizId } });
    if (!quiz) return;

    await this.quizzesRepo.update(quizId, { status: 'published' });
    await this.notifyEnrolledStudents(courseId, quiz.id, quiz.title);
  }

  // Best-effort, exactly like `ExamGenerationService.notifyEnrolledStudents`:
  // the quiz is already published, so a notification hiccup must not
  // surface to the teacher as a failed publish.
  private async notifyEnrolledStudents(
    courseId: string,
    quizId: string,
    quizTitle: string,
  ): Promise<void> {
    try {
      const studentIds =
        await this.enrollmentsService.listActiveStudentIds(courseId);
      await Promise.allSettled(
        studentIds.map((studentId) =>
          this.notificationProducer.notify({
            userId: studentId,
            type: 'quiz_ready',
            title: 'اختبار جديد متاح',
            message: `اختبار جديد "${quizTitle}" متاح دلوقتي، جاهز للحل.`,
            relatedEntityType: 'quiz',
            relatedEntityId: quizId,
          }),
        ),
      );
    } catch (error: unknown) {
      this.logger.warn(
        `Publish notification fan-out failed for quiz=${quizId}: ${String(error)}`,
      );
    }
  }

  /**
   * Undoes one attempt's output so a re-run (or a rejection) doesn't
   * leave a half-published artifact behind. Safe to call on a step that
   * produced nothing — every branch is keyed off an id being present.
   */
  private async discardStepArtifact(
    step: LessonAgentStepEntity,
  ): Promise<void> {
    if (step.agentKey === 'handout' && step.output?.documentId) {
      const document = await this.documentsRepo.findOne({
        where: { id: step.output.documentId },
      });
      if (document) {
        await this.documentsRepo.softRemove(document);
      }
      await this.dataSource.query(
        `UPDATE document_chunks SET is_active = false WHERE document_id = $1`,
        [step.output.documentId],
      );
    }

    if (step.agentKey === 'quizmaster' && step.output?.quizId) {
      const quiz = await this.quizzesRepo.findOne({
        where: { id: step.output.quizId },
      });
      if (quiz) {
        await this.quizzesRepo.softRemove(quiz);
      }
    }
  }

  // ── Private: setup ──

  /**
   * Every agent in the roster gets a row up front — including the ones
   * this run has switched off, recorded as `skipped`. The teacher then
   * sees the whole crew from the first render, with the sit-outs greyed
   * out, instead of watching cards pop into existence one by one.
   */
  private async seedSteps(
    runId: string,
    config: LessonAgentRunConfig,
  ): Promise<void> {
    const rows = AGENT_ROSTER.map((agent, index) => {
      const enabled = config.enabledAgents.includes(agent.key);
      return this.stepsRepo.create({
        runId,
        agentKey: agent.key,
        orderIndex: index,
        status: enabled ? ('pending' as const) : ('skipped' as const),
        reviewStatus: 'not_required' as const,
        progress: enabled ? 0 : 100,
        headline: enabled ? null : 'الوكيل ده متوقف من الإعدادات',
      });
    });

    await this.stepsRepo.save(rows);
  }

  private toRunConfig(settings: AgentSettingsResponse): LessonAgentRunConfig {
    const enabledAgents = AGENT_ROSTER.filter(
      (agent) =>
        agent.mandatory ||
        (agent.key === 'handout' && settings.handoutEnabled) ||
        (agent.key === 'quizmaster' && settings.quizEnabled),
    ).map((agent) => agent.key);

    return {
      enabledAgents,
      handout: {
        pageCount: settings.handoutPageCount,
        tone: settings.handoutTone as LessonAgentRunConfig['handout']['tone'],
        includeExamples: settings.handoutIncludeExamples,
        includeKeyTerms: settings.handoutIncludeKeyTerms,
        includeSummary: settings.handoutIncludeSummary,
      },
      quiz: {
        difficulty:
          settings.quizDifficulty as LessonAgentRunConfig['quiz']['difficulty'],
        questionCount: settings.quizQuestionCount,
        types: settings.quizTypes as LessonAgentRunConfig['quiz']['types'],
        dueInDays: settings.quizDueInDays,
      },
    };
  }

  private async recordEvent(
    runId: string,
    event: {
      type: LessonAgentEventEntity['type'];
      message: string;
      stepId?: string;
      agentKey?: LessonAgentKey;
      toAgentKey?: LessonAgentKey;
      metadata?: Record<string, unknown>;
    },
  ): Promise<void> {
    await this.eventsRepo.save(
      this.eventsRepo.create({
        runId,
        stepId: event.stepId ?? null,
        agentKey: event.agentKey ?? null,
        toAgentKey: event.toAgentKey ?? null,
        type: event.type,
        message: event.message,
        metadata: event.metadata ?? null,
      }),
    );
  }

  // ── Private: loading & authorization ──

  private async loadOwnedLesson(
    lessonId: string,
    teacherId: string,
  ): Promise<LessonEntity> {
    const lesson = await this.lessonsRepo.findOne({
      where: { id: lessonId, deletedAt: IsNull() },
    });
    if (!lesson) {
      throw new NotFoundException('Lesson not found.');
    }
    await this.assertTeacherOwnsCourse(lesson.courseId, teacherId);
    return lesson;
  }

  private async loadOwnedRun(
    runId: string,
    teacherId: string,
  ): Promise<LessonAgentRunEntity> {
    const run = await this.runsRepo.findOne({ where: { id: runId } });
    if (!run) {
      throw new NotFoundException('Agent run not found.');
    }
    if (run.teacherId !== teacherId) {
      throw new ForbiddenException('You do not own this run.');
    }
    return run;
  }

  /**
   * Guards every review action: the step must belong to this run, be one
   * the teacher actually reviews, and have finished producing something.
   * A step still `running` has no output to judge yet.
   */
  private async loadReviewableStep(
    runId: string,
    stepId: string,
    teacherId: string,
  ): Promise<{ run: LessonAgentRunEntity; step: LessonAgentStepEntity }> {
    const run = await this.loadOwnedRun(runId, teacherId);
    const step = await this.stepsRepo.findOne({
      where: { id: stepId, runId: run.id },
    });
    if (!step) {
      throw new NotFoundException('Agent step not found in this run.');
    }
    if (!AGENT_BY_KEY[step.agentKey].reviewable) {
      throw new BadRequestException('الوكيل ده مش محتاج مراجعة منك.');
    }
    if (step.status !== 'completed') {
      throw new ConflictException('الوكيل ده لسه ما خلّصش شغله.');
    }
    return { run, step };
  }

  private async assertTeacherOwnsCourse(
    courseId: string,
    teacherId: string,
  ): Promise<CourseEntity> {
    const course = await this.coursesRepo.findOne({
      where: { id: courseId, deletedAt: IsNull() },
    });
    if (!course) {
      throw new NotFoundException('Course not found.');
    }
    if (course.teacherId !== teacherId) {
      throw new ForbiddenException('You do not own this course.');
    }
    return course;
  }

  // ── Private: mapping ──

  /**
   * Publishing is allowed once no reviewable step is still waiting on
   * the teacher. A step whose revision is queued (`revision_requested`)
   * blocks too — the agent is literally still working on it.
   */
  private canPublish(
    run: LessonAgentRunEntity,
    steps: LessonAgentStepEntity[],
  ): boolean {
    if (run.status !== 'pending_review') return false;
    return steps.every(
      (step) =>
        step.reviewStatus === 'not_required' ||
        step.reviewStatus === 'approved' ||
        step.reviewStatus === 'rejected',
    );
  }

  /**
   * Overall progress is the mean over the agents that actually run —
   * a switched-off agent must not drag the bar down, and must not
   * inflate it either, so it's excluded rather than counted as 100.
   */
  private overallProgress(steps: LessonAgentStepEntity[]): number {
    const active = steps.filter((step) => step.status !== 'skipped');
    if (active.length === 0) return 100;
    const total = active.reduce((sum, step) => sum + step.progress, 0);
    return Math.round(total / active.length);
  }

  private toSummary(
    run: LessonAgentRunEntity,
    steps: LessonAgentStepEntity[],
  ): LessonAgentRunSummary {
    return {
      id: run.id,
      lessonId: run.lessonId,
      courseId: run.courseId,
      status: run.status,
      progress: this.overallProgress(steps),
      errorMessage: run.errorMessage,
      createdAt: run.createdAt.toISOString(),
      finishedAt: run.finishedAt?.toISOString() ?? null,
    };
  }

  private toStepResponse(
    step: LessonAgentStepEntity,
    feedback: LessonAgentStepFeedbackEntity[],
  ): LessonAgentStepResponse {
    const definition = AGENT_BY_KEY[step.agentKey];
    return {
      id: step.id,
      agentKey: step.agentKey,
      name: definition.name,
      role: definition.role,
      icon: definition.icon,
      mandatory: definition.mandatory,
      reviewable: definition.reviewable,
      orderIndex: step.orderIndex,
      status: step.status,
      reviewStatus: step.reviewStatus,
      progress: step.progress,
      headline: step.headline,
      output: step.output,
      errorMessage: step.errorMessage,
      attempt: step.attempt,
      startedAt: step.startedAt?.toISOString() ?? null,
      finishedAt: step.finishedAt?.toISOString() ?? null,
      feedback: feedback.map((entry) => ({
        id: entry.id,
        message: entry.message,
        createdAt: entry.createdAt.toISOString(),
      })),
    };
  }

  /**
   * `{ ...current, ...dto }` would let an absent optional field
   * overwrite a real value with `undefined`, so absent keys are dropped
   * before the spread.
   */
  private stripUndefined<T extends object>(source: T): Partial<T> {
    return Object.fromEntries(
      Object.entries(source).filter(([, value]) => value !== undefined),
    ) as Partial<T>;
  }
}
