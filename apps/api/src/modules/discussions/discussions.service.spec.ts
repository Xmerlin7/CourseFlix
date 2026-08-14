import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test } from '@nestjs/testing';
import { NOTIFICATION_PRODUCER_PORT } from '../../common/ports/notification-producer.port';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { AttachmentsService } from '../attachments/attachments.service';
import { CourseEntity } from '../courses/entities/course.entity';
import { EnrollmentsService } from '../enrollments/enrollments.service';
import { UserEntity } from '../users/entities/user.entity';
import { FileEntity } from '../documents/entities/file.entity';
import { DiscussionsService } from './discussions.service';
import { DiscussionHelpfulVoteEntity } from './entities/discussion-helpful-vote.entity';
import { DiscussionReplyEntity } from './entities/discussion-reply.entity';
import { DiscussionThreadAttachmentEntity } from './entities/discussion-thread-attachment.entity';
import { DiscussionThreadEntity } from './entities/discussion-thread.entity';

function makeUser(
  overrides: Partial<AuthenticatedUser> = {},
): AuthenticatedUser {
  return {
    id: 'user-1',
    email: 'user@example.com',
    role: 'student',
    fullName: 'Test User',
    avatarUrl: null,
    managedByTeacherId: null,
    ...overrides,
  };
}

function makeQueryBuilder(threads: DiscussionThreadEntity[]) {
  const qb: Record<string, jest.Mock> = {
    where: jest.fn(),
    andWhere: jest.fn(),
    orderBy: jest.fn(),
    addOrderBy: jest.fn(),
    take: jest.fn(),
    getMany: jest.fn().mockResolvedValue(threads),
  };
  // Every chainable method returns the same builder.
  qb.where.mockReturnValue(qb);
  qb.andWhere.mockReturnValue(qb);
  qb.orderBy.mockReturnValue(qb);
  qb.addOrderBy.mockReturnValue(qb);
  qb.take.mockReturnValue(qb);
  return qb;
}

describe('DiscussionsService', () => {
  let service: DiscussionsService;
  let threadsRepository: Record<string, jest.Mock>;
  let repliesRepository: Record<string, jest.Mock>;
  let helpfulVotesRepository: Record<string, jest.Mock>;
  let attachmentsJoinRepository: Record<string, jest.Mock>;
  let filesRepository: Record<string, jest.Mock>;
  let coursesRepository: Record<string, jest.Mock>;
  let usersRepository: Record<string, jest.Mock>;
  let enrollmentsService: { assertStudentEnrolled: jest.Mock };
  let attachmentsService: { saveAttachment: jest.Mock };
  let notifications: { notify: jest.Mock };

  const course = { id: 'course-1', teacherId: 'teacher-1' } as CourseEntity;

  const baseThread: DiscussionThreadEntity = {
    id: 'thread-1',
    courseId: 'course-1',
    authorId: 'student-1',
    authorRole: 'student',
    title: 'قانون كولوم مش واضح',
    body: 'ممكن حد يشرحلي؟',
    tags: ['فيزياء'],
    acceptedReplyId: null,
    replyCount: 0,
    helpfulCount: 0,
    isPinned: false,
    deletedAt: null,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  };

  beforeEach(async () => {
    threadsRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
      create: jest.fn((input) => input),
      createQueryBuilder: jest.fn(),
      increment: jest.fn(),
      decrement: jest.fn(),
    };
    repliesRepository = {
      findOne: jest.fn(),
      find: jest.fn().mockResolvedValue([]),
      save: jest.fn(),
      create: jest.fn((input) => input),
    };
    helpfulVotesRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
      create: jest.fn((input) => input),
      delete: jest.fn(),
      find: jest.fn().mockResolvedValue([]),
    };
    attachmentsJoinRepository = {
      find: jest.fn().mockResolvedValue([]),
      save: jest.fn(),
      create: jest.fn((input) => input),
    };
    filesRepository = { find: jest.fn().mockResolvedValue([]) };
    coursesRepository = { findOne: jest.fn().mockResolvedValue(course) };
    usersRepository = { find: jest.fn().mockResolvedValue([]) };
    enrollmentsService = {
      assertStudentEnrolled: jest.fn().mockResolvedValue(undefined),
    };
    attachmentsService = { saveAttachment: jest.fn() };
    notifications = {
      notify: jest.fn().mockResolvedValue(undefined),
      markEntityRead: jest.fn().mockResolvedValue(1),
      markEntitiesRead: jest.fn().mockResolvedValue(1),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        DiscussionsService,
        {
          provide: getRepositoryToken(DiscussionThreadEntity),
          useValue: threadsRepository,
        },
        {
          provide: getRepositoryToken(DiscussionReplyEntity),
          useValue: repliesRepository,
        },
        {
          provide: getRepositoryToken(DiscussionHelpfulVoteEntity),
          useValue: helpfulVotesRepository,
        },
        {
          provide: getRepositoryToken(DiscussionThreadAttachmentEntity),
          useValue: attachmentsJoinRepository,
        },
        { provide: getRepositoryToken(FileEntity), useValue: filesRepository },
        {
          provide: getRepositoryToken(CourseEntity),
          useValue: coursesRepository,
        },
        { provide: getRepositoryToken(UserEntity), useValue: usersRepository },
        { provide: EnrollmentsService, useValue: enrollmentsService },
        { provide: AttachmentsService, useValue: attachmentsService },
        { provide: NOTIFICATION_PRODUCER_PORT, useValue: notifications },
      ],
    }).compile();

    service = moduleRef.get(DiscussionsService);
  });

  describe('listThreads', () => {
    it('lets an enrolled student list discussions in their course', async () => {
      const qb = makeQueryBuilder([baseThread]);
      threadsRepository.createQueryBuilder.mockReturnValue(qb);

      const result = await service.listThreads('course-1', makeUser(), {
        status: 'all',
      });

      expect(enrollmentsService.assertStudentEnrolled).toHaveBeenCalledWith(
        'user-1',
        'course-1',
      );
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe(baseThread.title);
    });

    it('rejects a student who is not enrolled in the course', async () => {
      enrollmentsService.assertStudentEnrolled.mockRejectedValue(
        new ForbiddenException('You are not enrolled in this course.'),
      );

      await expect(
        service.listThreads('course-1', makeUser(), { status: 'all' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('applies the unanswered/answered/mine status filter to the query', async () => {
      const qb = makeQueryBuilder([]);
      threadsRepository.createQueryBuilder.mockReturnValue(qb);

      await service.listThreads('course-1', makeUser(), {
        status: 'unanswered',
      });

      expect(qb.andWhere).toHaveBeenCalledWith('t.acceptedReplyId IS NULL');
    });

    it('applies a search filter across title/body/tags', async () => {
      const qb = makeQueryBuilder([]);
      threadsRepository.createQueryBuilder.mockReturnValue(qb);

      await service.listThreads('course-1', makeUser(), { search: 'كولوم' });

      expect(qb.andWhere).toHaveBeenCalledWith(
        expect.stringContaining('ILIKE'),
        expect.objectContaining({ search: '%كولوم%' }),
      );
    });

    it('lets the owning teacher list discussions without an enrollment check', async () => {
      const qb = makeQueryBuilder([baseThread]);
      threadsRepository.createQueryBuilder.mockReturnValue(qb);

      await service.listThreads(
        'course-1',
        makeUser({ id: 'teacher-1', role: 'teacher' }),
        { status: 'all' },
      );

      expect(enrollmentsService.assertStudentEnrolled).not.toHaveBeenCalled();
    });

    it('rejects a teacher who does not own the course', async () => {
      await expect(
        service.listThreads(
          'course-1',
          makeUser({ id: 'someone-else', role: 'teacher' }),
          { status: 'all' },
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('createThread', () => {
    it('lets an enrolled student ask a question', async () => {
      threadsRepository.save.mockImplementation((input) =>
        Promise.resolve({ ...baseThread, ...input, id: 'thread-1' }),
      );
      threadsRepository.findOne.mockResolvedValue({
        ...baseThread,
        title: 'سؤال جديد',
        body: 'تفاصيل السؤال',
      });
      repliesRepository.find.mockResolvedValue([]);
      attachmentsJoinRepository.find.mockResolvedValue([]);

      const result = await service.createThread('course-1', makeUser(), {
        title: 'سؤال جديد',
        body: 'تفاصيل السؤال',
        tags: [],
      });

      expect(enrollmentsService.assertStudentEnrolled).toHaveBeenCalledWith(
        'user-1',
        'course-1',
      );
      expect(result.title).toBe('سؤال جديد');
      expect(notifications.notify).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'teacher-1',
          relatedEntityType: 'discussion_thread',
        }),
      );
    });

    it('rejects a teacher trying to ask a question', async () => {
      await expect(
        service.createThread(
          'course-1',
          makeUser({ id: 'teacher-1', role: 'teacher' }),
          {
            title: 'سؤال',
            body: 'تفاصيل',
            tags: [],
          },
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('rejects an empty title or body', async () => {
      await expect(
        service.createThread('course-1', makeUser(), {
          title: '   ',
          body: 'تفاصيل',
          tags: [],
        }),
      ).rejects.toThrow('عنوان السؤال مطلوب.');

      await expect(
        service.createThread('course-1', makeUser(), {
          title: 'عنوان',
          body: '   ',
          tags: [],
        }),
      ).rejects.toThrow('تفاصيل السؤال مطلوبة.');
    });
  });

  describe('createReply', () => {
    it("records the replying user's role on the reply", async () => {
      threadsRepository.findOne.mockResolvedValue(baseThread);
      repliesRepository.save.mockImplementation((input) =>
        Promise.resolve({ ...input, id: 'reply-1', createdAt: new Date() }),
      );
      usersRepository.find.mockResolvedValue([
        { id: 'teacher-1', fullName: 'المدرس', avatarUrl: null },
      ]);

      const teacher = makeUser({
        id: 'teacher-1',
        role: 'teacher',
        fullName: 'المدرس',
      });
      const result = await service.createReply('thread-1', teacher, {
        body: 'إليك الشرح',
      });

      expect(result.author.role).toBe('teacher');
      expect(repliesRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ authorRole: 'teacher', body: 'إليك الشرح' }),
      );
      // The thread author (a different user) gets notified of the reply.
      expect(notifications.notify).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'student-1',
          type: 'discussion_reply',
        }),
      );
    });

    it("rejects a reply from a student not enrolled in the thread's course", async () => {
      threadsRepository.findOne.mockResolvedValue(baseThread);
      enrollmentsService.assertStudentEnrolled.mockRejectedValue(
        new ForbiddenException('You are not enrolled in this course.'),
      );

      await expect(
        service.createReply('thread-1', makeUser({ id: 'other-student' }), {
          body: 'رد',
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws NotFoundException for a non-existent thread', async () => {
      threadsRepository.findOne.mockResolvedValue(null);

      await expect(
        service.createReply('missing-thread', makeUser(), { body: 'رد' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('acceptAnswer', () => {
    it('lets the question author mark a reply as the accepted answer', async () => {
      threadsRepository.findOne.mockResolvedValue({ ...baseThread });
      repliesRepository.findOne.mockResolvedValue({
        id: 'reply-1',
        threadId: 'thread-1',
        authorId: 'teacher-1',
        authorRole: 'teacher',
        body: 'الشرح',
        createdAt: new Date(),
      });
      threadsRepository.save.mockImplementation((input) =>
        Promise.resolve(input),
      );
      repliesRepository.find.mockResolvedValue([]);

      await service.acceptAnswer(
        'thread-1',
        'reply-1',
        makeUser({ id: 'student-1' }),
      );

      expect(threadsRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ acceptedReplyId: 'reply-1' }),
      );
    });

    it('rejects anyone other than the question author', async () => {
      threadsRepository.findOne.mockResolvedValue({ ...baseThread });

      await expect(
        service.acceptAnswer(
          'thread-1',
          'reply-1',
          makeUser({ id: 'someone-else' }),
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('toggleHelpful', () => {
    it('adds a helpful vote when none exists yet', async () => {
      threadsRepository.findOne.mockResolvedValue({ ...baseThread });
      helpfulVotesRepository.findOne.mockResolvedValue(null);

      const result = await service.toggleHelpful('thread-1', makeUser());

      expect(helpfulVotesRepository.save).toHaveBeenCalled();
      expect(threadsRepository.increment).toHaveBeenCalledWith(
        { id: 'thread-1' },
        'helpfulCount',
        1,
      );
      expect(result.isHelpfulByMe).toBe(true);
    });

    it('removes an existing helpful vote (toggle off)', async () => {
      threadsRepository.findOne.mockResolvedValue({
        ...baseThread,
        helpfulCount: 1,
      });
      helpfulVotesRepository.findOne.mockResolvedValue({
        threadId: 'thread-1',
        userId: 'user-1',
      });

      const result = await service.toggleHelpful('thread-1', makeUser());

      expect(helpfulVotesRepository.delete).toHaveBeenCalled();
      expect(result.isHelpfulByMe).toBe(false);
    });
  });

  describe('markCourseDiscussionsRead', () => {
    it('marks all thread notifications for the course as read', async () => {
      threadsRepository.find = jest
        .fn()
        .mockResolvedValue([{ id: 'thread-1' }, { id: 'thread-2' }]);

      const result = await service.markCourseDiscussionsRead(
        'course-1',
        makeUser({ id: 'student-1' }),
      );

      expect(notifications.markEntitiesRead).toHaveBeenCalledWith(
        'student-1',
        'discussion_thread',
        ['thread-1', 'thread-2'],
      );
      expect(result).toEqual({ updated: 1 });
    });

    it('returns 0 when there are no threads in the course', async () => {
      threadsRepository.find = jest.fn().mockResolvedValue([]);

      const result = await service.markCourseDiscussionsRead(
        'course-1',
        makeUser({ id: 'student-1' }),
      );

      expect(result).toEqual({ updated: 0 });
    });
  });
});
