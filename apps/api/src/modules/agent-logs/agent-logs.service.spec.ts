import { BadRequestException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test } from '@nestjs/testing';
import { AgentLogsService } from './agent-logs.service';
import { AgentLogEntity } from './entities/agent-log.entity';
import { CoursesService } from '../courses/courses.service';

describe('AgentLogsService', () => {
  let agentLogsService: AgentLogsService;
  let agentLogsRepository: {
    find: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };
  let coursesService: { findOwnedCourses: jest.Mock };

  const teacherA = 'teacher-a';
  const teacherB = 'teacher-b';
  const courseOwnedByA = 'course-a-1';

  beforeEach(async () => {
    agentLogsRepository = {
      find: jest.fn().mockResolvedValue([]),
      create: jest.fn((input: Partial<AgentLogEntity>) => input),
      save: jest.fn((input: Partial<AgentLogEntity>) => ({
        id: 'log-1',
        ...input,
      })),
    };
    coursesService = {
      findOwnedCourses: jest.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        AgentLogsService,
        {
          provide: getRepositoryToken(AgentLogEntity),
          useValue: agentLogsRepository,
        },
        { provide: CoursesService, useValue: coursesService },
      ],
    }).compile();

    agentLogsService = moduleRef.get(AgentLogsService);
  });

  describe('record', () => {
    it('persists a structured entry with no raw-text fields', async () => {
      await agentLogsService.record({
        agentType: 'proactive_proctor',
        action: 'intervention.created',
        status: 'success',
        courseId: courseOwnedByA,
        targetEntityType: 'intervention',
        targetEntityId: 'intervention-1',
        metadata: { ruleKey: 'low_quiz_score' },
      });

      expect(agentLogsRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          agentType: 'proactive_proctor',
          action: 'intervention.created',
          status: 'success',
          courseId: courseOwnedByA,
          metadata: { ruleKey: 'low_quiz_score' },
        }),
      );
    });
  });

  describe('listForTeacher', () => {
    it("only ever scopes by the caller's owned courses", async () => {
      coursesService.findOwnedCourses.mockResolvedValue([
        { id: courseOwnedByA },
      ]);

      await agentLogsService.listForTeacher(teacherA);

      expect(coursesService.findOwnedCourses).toHaveBeenCalledWith(teacherA);
      const [callArgs] = agentLogsRepository.find.mock.calls[0] as [
        { where: { courseId: unknown } },
      ];
      expect(callArgs.where.courseId).toBeDefined();
    });

    it('returns an empty list when the teacher owns no courses', async () => {
      coursesService.findOwnedCourses.mockResolvedValue([]);

      const result = await agentLogsService.listForTeacher(teacherB);

      expect(result).toEqual([]);
      expect(agentLogsRepository.find).not.toHaveBeenCalled();
    });

    it("returns an empty list when courseId filter isn't owned by the teacher (never another teacher's rows)", async () => {
      coursesService.findOwnedCourses.mockResolvedValue([
        { id: courseOwnedByA },
      ]);

      const result = await agentLogsService.listForTeacher(teacherA, {
        courseId: 'course-owned-by-teacher-b',
      });

      expect(result).toEqual([]);
      expect(agentLogsRepository.find).not.toHaveBeenCalled();
    });

    it('rejects an invalid agentType filter', async () => {
      coursesService.findOwnedCourses.mockResolvedValue([
        { id: courseOwnedByA },
      ]);

      await expect(
        agentLogsService.listForTeacher(teacherA, { agentType: 'bogus' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects an invalid status filter', async () => {
      coursesService.findOwnedCourses.mockResolvedValue([
        { id: courseOwnedByA },
      ]);

      await expect(
        agentLogsService.listForTeacher(teacherA, { status: 'bogus' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects an invalid date filter', async () => {
      coursesService.findOwnedCourses.mockResolvedValue([
        { id: courseOwnedByA },
      ]);

      await expect(
        agentLogsService.listForTeacher(teacherA, { from: 'not-a-date' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('maps both success and failed entries through with correlation IDs', async () => {
      coursesService.findOwnedCourses.mockResolvedValue([
        { id: courseOwnedByA },
      ]);
      agentLogsRepository.find.mockResolvedValue([
        {
          id: 'log-success',
          agentType: 'proactive_proctor',
          courseId: courseOwnedByA,
          targetEntityType: 'intervention',
          targetEntityId: 'intervention-1',
          action: 'intervention.created',
          status: 'success',
          tokensUsed: null,
          durationMs: 12,
          rowCount: null,
          correlationId: 'corr-1',
          metadata: null,
          errorMessage: null,
          executedAt: new Date('2026-08-04T10:00:00.000Z'),
        },
        {
          id: 'log-failed',
          agentType: 'analytics_agent',
          courseId: courseOwnedByA,
          targetEntityType: null,
          targetEntityId: null,
          action: 'analytics.question.unsupported',
          status: 'failed',
          tokensUsed: null,
          durationMs: 5,
          rowCount: 0,
          correlationId: 'corr-2',
          metadata: null,
          errorMessage: 'unsupported question',
          executedAt: new Date('2026-08-04T10:05:00.000Z'),
        },
      ]);

      const result = await agentLogsService.listForTeacher(teacherA);

      expect(result).toHaveLength(2);
      expect(result[0].correlationId).toBe('corr-1');
      expect(result[1].status).toBe('failed');
      expect(result[1].correlationId).toBe('corr-2');
    });
  });
});
