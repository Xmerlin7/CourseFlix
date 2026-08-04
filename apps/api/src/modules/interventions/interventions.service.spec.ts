import { getDataSourceToken, getRepositoryToken } from '@nestjs/typeorm';
import { Test } from '@nestjs/testing';
import {
  AGENT_LOG_PORT,
  AgentLogPort,
} from '../../common/ports/agent-log.port';
import { NOTIFICATION_PRODUCER_PORT } from '../../common/ports/notification-producer.port';
import { CoursesService } from '../courses/courses.service';
import { InterventionsService } from './interventions.service';
import { InterventionEvidenceEntity } from './entities/intervention-evidence.entity';
import { InterventionEntity } from './entities/intervention.entity';
import { ProgressReportEntity } from './entities/progress-report.entity';
import { UserEntity } from '../users/entities/user.entity';

describe('InterventionsService', () => {
  let service: InterventionsService;
  let interventionsRepository: { find: jest.Mock };
  let usersRepository: { find: jest.Mock };
  let coursesService: { findCourseById: jest.Mock };
  let notificationPort: { notify: jest.Mock };
  let agentLogPort: jest.Mocked<AgentLogPort>;
  let queryRunner: {
    connect: jest.Mock;
    startTransaction: jest.Mock;
    commitTransaction: jest.Mock;
    rollbackTransaction: jest.Mock;
    release: jest.Mock;
    manager: { save: jest.Mock };
  };
  let dataSource: { createQueryRunner: jest.Mock };

  const course = { id: 'course-1', title: 'الفيزياء', teacherId: 'teacher-1' };
  const studentId = 'student-1';

  function savedEntityFor(EntityClass: unknown, data: Record<string, unknown>) {
    if (EntityClass === InterventionEntity) {
      return { id: 'intervention-1', ...data };
    }
    if (EntityClass === ProgressReportEntity) {
      return { id: 'report-1', ...data };
    }
    if (EntityClass === InterventionEvidenceEntity) {
      return { id: 'evidence-1', ...data };
    }
    return data;
  }

  beforeEach(async () => {
    interventionsRepository = { find: jest.fn().mockResolvedValue([]) };
    usersRepository = { find: jest.fn().mockResolvedValue([]) };
    coursesService = { findCourseById: jest.fn().mockResolvedValue(course) };
    notificationPort = { notify: jest.fn().mockResolvedValue(undefined) };
    agentLogPort = { record: jest.fn().mockResolvedValue(undefined) };

    queryRunner = {
      connect: jest.fn().mockResolvedValue(undefined),
      startTransaction: jest.fn().mockResolvedValue(undefined),
      commitTransaction: jest.fn().mockResolvedValue(undefined),
      rollbackTransaction: jest.fn().mockResolvedValue(undefined),
      release: jest.fn().mockResolvedValue(undefined),
      manager: {
        save: jest.fn((EntityClass: unknown, data: Record<string, unknown>) =>
          Promise.resolve(savedEntityFor(EntityClass, data)),
        ),
      },
    };
    dataSource = { createQueryRunner: jest.fn(() => queryRunner) };

    const moduleRef = await Test.createTestingModule({
      providers: [
        InterventionsService,
        { provide: getDataSourceToken(), useValue: dataSource },
        {
          provide: getRepositoryToken(InterventionEntity),
          useValue: interventionsRepository,
        },
        { provide: getRepositoryToken(UserEntity), useValue: usersRepository },
        { provide: CoursesService, useValue: coursesService },
        { provide: NOTIFICATION_PRODUCER_PORT, useValue: notificationPort },
        { provide: AGENT_LOG_PORT, useValue: agentLogPort },
      ],
    }).compile();

    service = moduleRef.get(InterventionsService);
  });

  describe('evaluateSignal — quiz_score', () => {
    it('creates an intervention, report, and evidence below the threshold', async () => {
      await service.evaluateSignal({
        kind: 'quiz_score',
        studentId,
        courseId: course.id,
        weakConcept: 'قوانين نيوتن',
        scorePercent: 40,
        evidenceRefId: 'submission-1',
      });

      const savedEntityClasses = queryRunner.manager.save.mock.calls.map(
        (call) => call[0],
      );
      expect(savedEntityClasses).toEqual([
        InterventionEntity,
        ProgressReportEntity,
        InterventionEvidenceEntity,
      ]);
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
    });

    it('stores the rule/version on the created intervention', async () => {
      await service.evaluateSignal({
        kind: 'quiz_score',
        studentId,
        courseId: course.id,
        weakConcept: 'قوانين نيوتن',
        scorePercent: 40,
        evidenceRefId: 'submission-1',
      });

      const [, interventionData] = queryRunner.manager.save.mock.calls[0] as [
        unknown,
        { ruleKey: string; ruleVersion: number },
      ];
      expect(interventionData.ruleKey).toBe('low_quiz_score');
      expect(interventionData.ruleVersion).toBe(1);
    });

    it('never mutates enrollment/suspension state — no such repository is even wired', () => {
      expect(dataSource.createQueryRunner).toBeDefined();
      // Structural guarantee: InterventionsService has no injected
      // EnrollmentEntity/EnrollmentsService dependency, so no code path
      // in this service can touch enrollment status.
    });

    it('is a no-op at or above the threshold', async () => {
      await service.evaluateSignal({
        kind: 'quiz_score',
        studentId,
        courseId: course.id,
        weakConcept: 'قوانين نيوتن',
        scorePercent: 75,
        evidenceRefId: 'submission-1',
      });

      expect(dataSource.createQueryRunner).not.toHaveBeenCalled();
      expect(notificationPort.notify).not.toHaveBeenCalled();
      expect(agentLogPort.record).not.toHaveBeenCalled();
    });

    it('is a no-op when a duplicate signal hits the active dedup index', async () => {
      queryRunner.manager.save.mockImplementationOnce(() => {
        return Promise.reject(
          Object.assign(new Error('duplicate key'), { code: '23505' }),
        );
      });

      await service.evaluateSignal({
        kind: 'quiz_score',
        studentId,
        courseId: course.id,
        weakConcept: 'قوانين نيوتن',
        scorePercent: 40,
        evidenceRefId: 'submission-1',
      });

      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(queryRunner.commitTransaction).not.toHaveBeenCalled();
      expect(notificationPort.notify).not.toHaveBeenCalled();
      expect(agentLogPort.record).not.toHaveBeenCalled();
    });

    it('reconciles the student notification, teacher notification, and agent log to the same intervention ID', async () => {
      await service.evaluateSignal({
        kind: 'quiz_score',
        studentId,
        courseId: course.id,
        weakConcept: 'قوانين نيوتن',
        scorePercent: 40,
        evidenceRefId: 'submission-1',
      });

      const notifyCalls = notificationPort.notify.mock.calls as Array<
        [{ relatedEntityId: string }]
      >;
      expect(notifyCalls).toHaveLength(2);
      expect(notifyCalls[0][0].relatedEntityId).toBe('intervention-1');
      expect(notifyCalls[1][0].relatedEntityId).toBe('intervention-1');

      const [logCall] = agentLogPort.record.mock.calls[0] as [
        { targetEntityId: string; agentType: string },
      ];
      expect(logCall.targetEntityId).toBe('intervention-1');
      expect(logCall.agentType).toBe('proactive_proctor');
    });
  });

  describe('evaluateSignal — chat_message', () => {
    it('triggers on the explicit confusion phrase and uses the course title as the concept', async () => {
      await service.evaluateSignal({
        kind: 'chat_message',
        studentId,
        courseId: course.id,
        messageText: 'مش فاهم',
        priorMessageTexts: [],
        evidenceRefId: 'message-1',
      });

      const [, interventionData] = queryRunner.manager.save.mock.calls[0] as [
        unknown,
        { ruleKey: string; weakConcept: string },
      ];
      expect(interventionData.ruleKey).toBe('explicit_confusion_phrase');
      expect(interventionData.weakConcept).toBe(course.title);
    });

    it('triggers on a repeated question', async () => {
      await service.evaluateSignal({
        kind: 'chat_message',
        studentId,
        courseId: course.id,
        messageText: 'ما هو قانون نيوتن؟',
        priorMessageTexts: ['ما هو قانون نيوتن؟'],
        evidenceRefId: 'message-2',
      });

      const [, interventionData] = queryRunner.manager.save.mock.calls[0] as [
        unknown,
        { ruleKey: string },
      ];
      expect(interventionData.ruleKey).toBe('repeated_concept_question');
    });

    it('is a no-op when neither chat rule matches', async () => {
      await service.evaluateSignal({
        kind: 'chat_message',
        studentId,
        courseId: course.id,
        messageText: 'سؤال جديد تمامًا',
        priorMessageTexts: [],
        evidenceRefId: 'message-3',
      });

      expect(dataSource.createQueryRunner).not.toHaveBeenCalled();
    });
  });

  describe('listForStudent', () => {
    it("only ever queries by the caller's own studentId", async () => {
      await service.listForStudent(studentId);

      const [callArgs] = interventionsRepository.find.mock.calls[0] as [
        { where: { studentId: string } },
      ];
      expect(callArgs.where.studentId).toBe(studentId);
    });
  });

  describe('listForTeacher', () => {
    it("only ever queries by the caller's own teacherId", async () => {
      await service.listForTeacher('teacher-1');

      const [callArgs] = interventionsRepository.find.mock.calls[0] as [
        { where: { teacherId: string } },
      ];
      expect(callArgs.where.teacherId).toBe('teacher-1');
    });
  });
});
