/* eslint-disable @typescript-eslint/unbound-method */
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { EnrollmentsService } from '../enrollments/enrollments.service';
import { JobsService } from '../jobs/jobs.service';
import { TeacherBillingService } from '../teacher-billing/teacher-billing.service';
import { LessonAgentEventEntity } from './entities/lesson-agent-event.entity';
import { LessonAgentRunEntity } from './entities/lesson-agent-run.entity';
import { LessonAgentStepFeedbackEntity } from './entities/lesson-agent-step-feedback.entity';
import { LessonAgentStepEntity } from './entities/lesson-agent-step.entity';
import { TeacherAgentSettingsEntity } from './entities/teacher-agent-settings.entity';
import { LessonAgentsService } from './lesson-agents.service';

const TEACHER_ID = 'teacher-1';
const OTHER_TEACHER_ID = 'teacher-2';

/**
 * Repositories are hand-stubbed rather than wired through a Nest testing
 * module — the service takes them as constructor arguments, and the
 * behaviour worth pinning here is its own decision-making, not TypeORM's.
 */
function makeRepo<T extends object>(
  overrides: Partial<Record<string, unknown>> = {},
) {
  return {
    find: jest.fn().mockResolvedValue([]),
    findOne: jest.fn().mockResolvedValue(null),
    create: jest.fn((entity: unknown) => entity),
    save: jest.fn((entity: unknown) => Promise.resolve(entity)),
    update: jest.fn().mockResolvedValue(undefined),
    softRemove: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  } as unknown as jest.Mocked<Repository<T>>;
}

/** Typed read of a stub's first recorded argument — `mock.calls` is `any[][]`. */
function firstArg<T>(fn: unknown): T {
  const calls = (fn as jest.Mock).mock.calls as unknown[][];
  return calls[0][0] as T;
}

describe('LessonAgentsService', () => {
  let service: LessonAgentsService;
  let runsRepo: jest.Mocked<Repository<LessonAgentRunEntity>>;
  let stepsRepo: jest.Mocked<Repository<LessonAgentStepEntity>>;
  let eventsRepo: jest.Mocked<Repository<LessonAgentEventEntity>>;
  let feedbackRepo: jest.Mocked<Repository<LessonAgentStepFeedbackEntity>>;
  let settingsRepo: jest.Mocked<Repository<TeacherAgentSettingsEntity>>;
  let lessonsRepo: jest.Mocked<Repository<never>>;
  let coursesRepo: jest.Mocked<Repository<never>>;
  let videosRepo: jest.Mocked<Repository<never>>;
  let documentsRepo: jest.Mocked<Repository<never>>;
  let quizzesRepo: jest.Mocked<Repository<never>>;
  let dataSource: { query: jest.Mock };
  let jobsService: jest.Mocked<Pick<JobsService, 'enqueueLessonAgents'>>;
  let enrollmentsService: jest.Mocked<
    Pick<EnrollmentsService, 'listActiveStudentIds'>
  >;
  let teacherBillingService: jest.Mocked<
    Pick<TeacherBillingService, 'consumeCredits'>
  >;
  let notificationProducer: { notify: jest.Mock };

  const lesson = {
    id: 'lesson-1',
    courseId: 'course-1',
    title: 'قانون نيوتن الأول',
    deletedAt: null,
  };
  const course = { id: 'course-1', teacherId: TEACHER_ID, deletedAt: null };
  const video = { id: 'video-1', lessonId: 'lesson-1' };

  /**
   * Fresh objects per test: the service mutates the entities it loads
   * (`step.attempt += 1`, `run.status = 'completed'`), so a fixture
   * shared across tests would leak one test's mutations into the next.
   */
  function makeRun(
    overrides: Partial<LessonAgentRunEntity> = {},
  ): LessonAgentRunEntity {
    return {
      id: 'run-1',
      teacherId: TEACHER_ID,
      courseId: 'course-1',
      lessonId: 'lesson-1',
      status: 'pending_review',
      config: {},
      createdAt: new Date(),
      startedAt: null,
      finishedAt: null,
      errorMessage: null,
      ...overrides,
    } as unknown as LessonAgentRunEntity;
  }

  function makeStep(
    overrides: Partial<LessonAgentStepEntity> = {},
  ): LessonAgentStepEntity {
    return {
      id: 'step-handout',
      runId: 'run-1',
      agentKey: 'handout',
      orderIndex: 3,
      status: 'completed',
      reviewStatus: 'pending',
      progress: 100,
      attempt: 1,
      headline: null,
      errorMessage: null,
      startedAt: null,
      finishedAt: null,
      output: { documentId: 'doc-1' },
      ...overrides,
    } as unknown as LessonAgentStepEntity;
  }

  /**
   * `runsRepo.findOne` serves two different lookups — the in-flight
   * guard (keyed by `lessonId`) and every load-by-id — so the stub has
   * to answer them differently rather than returning one fixed row.
   */
  function stubRunLookups(run: LessonAgentRunEntity | null, inFlight = null) {
    (runsRepo.findOne as jest.Mock).mockImplementation(
      (options: { where?: { id?: string; lessonId?: string } }) =>
        Promise.resolve(
          options?.where?.lessonId !== undefined ? inFlight : run,
        ),
    );
  }

  beforeEach(() => {
    runsRepo = makeRepo<LessonAgentRunEntity>({
      save: jest.fn((entity: unknown) =>
        Promise.resolve({
          id: 'run-1',
          createdAt: new Date(),
          finishedAt: null,
          startedAt: null,
          ...(entity as object),
        }),
      ),
    });
    stepsRepo = makeRepo<LessonAgentStepEntity>();
    eventsRepo = makeRepo<LessonAgentEventEntity>();
    feedbackRepo = makeRepo<LessonAgentStepFeedbackEntity>();
    settingsRepo = makeRepo<TeacherAgentSettingsEntity>();
    lessonsRepo = makeRepo({ findOne: jest.fn().mockResolvedValue(lesson) });
    coursesRepo = makeRepo({ findOne: jest.fn().mockResolvedValue(course) });
    videosRepo = makeRepo({ findOne: jest.fn().mockResolvedValue(video) });
    documentsRepo = makeRepo();
    quizzesRepo = makeRepo();
    dataSource = { query: jest.fn().mockResolvedValue([]) };
    jobsService = { enqueueLessonAgents: jest.fn().mockResolvedValue('job-1') };
    enrollmentsService = {
      listActiveStudentIds: jest.fn().mockResolvedValue([]),
    };
    teacherBillingService = {
      consumeCredits: jest.fn().mockResolvedValue(undefined),
    };
    notificationProducer = { notify: jest.fn().mockResolvedValue(undefined) };

    service = new LessonAgentsService(
      runsRepo,
      stepsRepo,
      eventsRepo,
      feedbackRepo,
      settingsRepo,
      lessonsRepo as never,
      coursesRepo as never,
      videosRepo as never,
      documentsRepo as never,
      quizzesRepo as never,
      dataSource as unknown as DataSource,
      jobsService as unknown as JobsService,
      enrollmentsService as unknown as EnrollmentsService,
      teacherBillingService as unknown as TeacherBillingService,
      notificationProducer,
    );

    // Default: no run in flight, and any load-by-id finds the run the
    // `save` stub above hands back.
    stubRunLookups(makeRun({ status: 'queued' }));
  });

  describe('getSettings', () => {
    it('returns the code defaults for a teacher who has never saved settings', async () => {
      const settings = await service.getSettings(TEACHER_ID);

      expect(settings.handoutEnabled).toBe(true);
      expect(settings.handoutPageCount).toBe(4);
      expect(settings.quizTypes).toEqual(['mcq', 'true_false']);
    });
  });

  describe('updateSettings', () => {
    it('merges a partial patch onto the defaults instead of blanking the rest', async () => {
      const saved = await service.updateSettings(TEACHER_ID, {
        quizQuestionCount: 12,
      });

      expect(saved.quizQuestionCount).toBe(12);
      // The eleven untouched fields must survive a one-field PATCH.
      expect(saved.handoutEnabled).toBe(true);
      expect(saved.quizDifficulty).toBe('medium');
      expect(settingsRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          teacherId: TEACHER_ID,
          quizQuestionCount: 12,
        }),
      );
    });
  });

  describe('startRun', () => {
    it('seeds a step for every agent, marking disabled ones skipped', async () => {
      settingsRepo.findOne.mockResolvedValue({
        teacherId: TEACHER_ID,
        handoutEnabled: true,
        handoutPageCount: 4,
        handoutTone: 'simple',
        handoutIncludeExamples: true,
        handoutIncludeKeyTerms: true,
        handoutIncludeSummary: true,
        quizEnabled: false,
        quizDifficulty: 'medium',
        quizQuestionCount: 8,
        quizTypes: ['mcq'],
        quizDueInDays: 7,
      } as TeacherAgentSettingsEntity);

      await service.startRun('lesson-1', TEACHER_ID);

      const seeded = firstArg<
        Array<{
          agentKey: string;
          status: string;
        }>
      >(stepsRepo.save);

      expect(seeded).toHaveLength(5);
      expect(
        seeded.find((step) => step.agentKey === 'quizmaster')?.status,
      ).toBe('skipped');
      expect(seeded.find((step) => step.agentKey === 'handout')?.status).toBe(
        'pending',
      );
      expect(jobsService.enqueueLessonAgents).toHaveBeenCalledWith('run-1');
    });

    it('freezes the settings into the run config so a later settings change cannot rewrite history', async () => {
      await service.startRun('lesson-1', TEACHER_ID, {
        overrides: { quizQuestionCount: 3, handoutEnabled: false },
      });

      const savedRun = firstArg<{
        config: { enabledAgents: string[]; quiz: { questionCount: number } };
      }>(runsRepo.save);

      expect(savedRun.config.quiz.questionCount).toBe(3);
      expect(savedRun.config.enabledAgents).not.toContain('handout');
      // The override is per-run; it must not be written back as a preference.
      expect(settingsRepo.save).not.toHaveBeenCalled();
    });

    it('always keeps the three mandatory agents enabled, whatever the overrides say', async () => {
      await service.startRun('lesson-1', TEACHER_ID, {
        overrides: { handoutEnabled: false, quizEnabled: false },
      });

      const savedRun = firstArg<{
        config: { enabledAgents: string[] };
      }>(runsRepo.save);

      expect(savedRun.config.enabledAgents).toEqual([
        'transcript',
        'reviewer',
        'indexer',
      ]);
    });

    it('charges the teacher for every agent the run will actually use', async () => {
      await service.startRun('lesson-1', TEACHER_ID);

      // transcript 1 + reviewer 1 + indexer 1 + handout 6 + quizmaster 5
      expect(teacherBillingService.consumeCredits).toHaveBeenCalledWith(
        TEACHER_ID,
        14,
      );
      expect(
        firstArg<{ creditsCharged: number }>(runsRepo.save).creditsCharged,
      ).toBe(14);
    });

    it('charges only for the agents that run when the optional ones are off', async () => {
      await service.startRun('lesson-1', TEACHER_ID, {
        overrides: { handoutEnabled: false, quizEnabled: false },
      });

      expect(teacherBillingService.consumeCredits).toHaveBeenCalledWith(
        TEACHER_ID,
        3,
      );
    });

    it('charges nothing when the run is refused', async () => {
      videosRepo.findOne.mockResolvedValue(null);

      await expect(service.startRun('lesson-1', TEACHER_ID)).rejects.toThrow(
        BadRequestException,
      );
      expect(teacherBillingService.consumeCredits).not.toHaveBeenCalled();
    });

    it('refuses a lesson with no video rather than queueing a crew with nothing to work on', async () => {
      videosRepo.findOne.mockResolvedValue(null);

      await expect(service.startRun('lesson-1', TEACHER_ID)).rejects.toThrow(
        BadRequestException,
      );
      expect(jobsService.enqueueLessonAgents).not.toHaveBeenCalled();
    });

    it('refuses a second run while one is still in flight', async () => {
      stubRunLookups(
        null,
        makeRun({ id: 'run-0', status: 'running' }) as never,
      );

      await expect(service.startRun('lesson-1', TEACHER_ID)).rejects.toThrow(
        ConflictException,
      );
      expect(jobsService.enqueueLessonAgents).not.toHaveBeenCalled();
    });

    it("refuses to touch another teacher's lesson", async () => {
      await expect(
        service.startRun('lesson-1', OTHER_TEACHER_ID),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('sendStepFeedback', () => {
    beforeEach(() => {
      const step = makeStep();
      stubRunLookups(makeRun());
      stepsRepo.findOne.mockResolvedValue(step);
      stepsRepo.find.mockResolvedValue([step]);
      documentsRepo.findOne.mockResolvedValue({ id: 'doc-1' } as never);
    });

    it('re-queues only the commented agent, not the whole run', async () => {
      await service.sendStepFeedback(
        'run-1',
        'step-handout',
        TEACHER_ID,
        'الشرح مختصر أوي',
      );

      expect(jobsService.enqueueLessonAgents).toHaveBeenCalledWith(
        'run-1',
        'handout',
      );
    });

    it('discards the previous attempt so an unapproved draft is never left behind', async () => {
      await service.sendStepFeedback(
        'run-1',
        'step-handout',
        TEACHER_ID,
        'زوّد أمثلة',
      );

      expect(documentsRepo.softRemove).toHaveBeenCalledWith({
        id: 'doc-1',
      });
      expect(dataSource.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE document_chunks SET is_active = false'),
        ['doc-1'],
      );
    });

    it('charges again for a rewrite — the same price as asking that agent the first time', async () => {
      await service.sendStepFeedback(
        'run-1',
        'step-handout',
        TEACHER_ID,
        'زوّد أمثلة',
      );

      expect(teacherBillingService.consumeCredits).toHaveBeenCalledWith(
        TEACHER_ID,
        6,
      );
    });

    it('resets the step and bumps its attempt counter', async () => {
      await service.sendStepFeedback(
        'run-1',
        'step-handout',
        TEACHER_ID,
        'أعد الصياغة',
      );

      expect(stepsRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'pending',
          reviewStatus: 'revision_requested',
          attempt: 2,
          output: null,
        }),
      );
    });

    it('rejects feedback on a mandatory agent, which the teacher never reviews', async () => {
      stepsRepo.findOne.mockResolvedValue(
        makeStep({ id: 'step-indexer', agentKey: 'indexer' }),
      );

      await expect(
        service.sendStepFeedback('run-1', 'step-indexer', TEACHER_ID, 'أعد'),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects feedback on an agent that has not finished yet', async () => {
      stepsRepo.findOne.mockResolvedValue(makeStep({ status: 'running' }));

      await expect(
        service.sendStepFeedback('run-1', 'step-handout', TEACHER_ID, 'أعد'),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('publishRun', () => {
    beforeEach(() => {
      stubRunLookups(makeRun());
    });

    it('activates the handout chunks and publishes the quiz for approved steps', async () => {
      stepsRepo.find.mockResolvedValue([
        makeStep({ reviewStatus: 'approved' }),
        makeStep({
          id: 'step-quiz',
          agentKey: 'quizmaster',
          reviewStatus: 'approved',
          output: { quizId: 'quiz-1' },
        }),
      ]);
      quizzesRepo.findOne.mockResolvedValue({
        id: 'quiz-1',
        title: 'اختبار الدرس',
      } as never);

      await service.publishRun('run-1', TEACHER_ID);

      expect(documentsRepo.update).toHaveBeenCalledWith('doc-1', {
        isAgentDraft: false,
      });
      expect(dataSource.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE document_chunks SET is_active = true'),
        ['doc-1'],
      );
      expect(quizzesRepo.update).toHaveBeenCalledWith('quiz-1', {
        status: 'published',
      });
    });

    it('refuses to publish while an agent is still waiting on the teacher', async () => {
      stepsRepo.find.mockResolvedValue([makeStep({ reviewStatus: 'pending' })]);

      await expect(service.publishRun('run-1', TEACHER_ID)).rejects.toThrow(
        ConflictException,
      );
      expect(documentsRepo.update).not.toHaveBeenCalled();
    });

    it('leaves a rejected step unpublished', async () => {
      stepsRepo.find.mockResolvedValue([
        makeStep({
          id: 'step-quiz',
          agentKey: 'quizmaster',
          reviewStatus: 'rejected',
          output: { quizId: 'quiz-1' },
        }),
      ]);

      await service.publishRun('run-1', TEACHER_ID);

      expect(quizzesRepo.update).not.toHaveBeenCalled();
    });
  });
});
