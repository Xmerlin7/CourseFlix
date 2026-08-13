import { ForbiddenException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test } from '@nestjs/testing';
import { NOTIFICATION_PRODUCER_PORT } from '../../common/ports/notification-producer.port';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { AttachmentsService } from '../attachments/attachments.service';
import { CourseEntity } from '../courses/entities/course.entity';
import { FileEntity } from '../documents/entities/file.entity';
import { EnrollmentEntity } from '../enrollments/entities/enrollment.entity';
import { EnrollmentsService } from '../enrollments/enrollments.service';
import { AnnouncementsService } from './announcements.service';
import { PostAttachmentEntity } from './entities/post-attachment.entity';
import { PostEntity } from './entities/post.entity';

function makeUser(
  overrides: Partial<AuthenticatedUser> = {},
): AuthenticatedUser {
  return {
    id: 'teacher-1',
    email: 'teacher@example.com',
    role: 'teacher',
    fullName: 'المدرس',
    avatarUrl: null,
    managedByTeacherId: null,
    ...overrides,
  };
}

describe('AnnouncementsService', () => {
  let service: AnnouncementsService;
  let postsRepository: Record<string, jest.Mock>;
  let attachmentsJoinRepository: Record<string, jest.Mock>;
  let filesRepository: Record<string, jest.Mock>;
  let coursesRepository: Record<string, jest.Mock>;
  let enrollmentsRepository: Record<string, jest.Mock>;
  let enrollmentsService: { assertStudentEnrolled: jest.Mock };
  let attachmentsService: { saveAttachment: jest.Mock };
  let notifications: { notify: jest.Mock };

  const course = { id: 'course-1', teacherId: 'teacher-1' } as CourseEntity;

  beforeEach(async () => {
    postsRepository = {
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn(),
      save: jest.fn(),
      create: jest.fn((input) => input),
      softDelete: jest.fn(),
    };
    attachmentsJoinRepository = { find: jest.fn().mockResolvedValue([]) };
    filesRepository = { find: jest.fn().mockResolvedValue([]) };
    coursesRepository = { findOne: jest.fn().mockResolvedValue(course) };
    enrollmentsRepository = {
      find: jest
        .fn()
        .mockResolvedValue([
          { studentId: 'student-1' },
          { studentId: 'student-2' },
        ]),
    };
    enrollmentsService = {
      assertStudentEnrolled: jest.fn().mockResolvedValue(undefined),
    };
    attachmentsService = { saveAttachment: jest.fn() };
    notifications = { notify: jest.fn().mockResolvedValue(undefined) };

    const moduleRef = await Test.createTestingModule({
      providers: [
        AnnouncementsService,
        { provide: getRepositoryToken(PostEntity), useValue: postsRepository },
        {
          provide: getRepositoryToken(PostAttachmentEntity),
          useValue: attachmentsJoinRepository,
        },
        { provide: getRepositoryToken(FileEntity), useValue: filesRepository },
        {
          provide: getRepositoryToken(CourseEntity),
          useValue: coursesRepository,
        },
        {
          provide: getRepositoryToken(EnrollmentEntity),
          useValue: enrollmentsRepository,
        },
        { provide: EnrollmentsService, useValue: enrollmentsService },
        { provide: AttachmentsService, useValue: attachmentsService },
        { provide: NOTIFICATION_PRODUCER_PORT, useValue: notifications },
      ],
    }).compile();

    service = moduleRef.get(AnnouncementsService);
  });

  it('lets the owning teacher post an announcement and notifies every enrolled student', async () => {
    postsRepository.save.mockImplementation((input) =>
      Promise.resolve({
        id: 'post-1',
        pinnedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...input,
      }),
    );

    const result = await service.createAnnouncement('course-1', makeUser(), {
      content: 'تم رفع الدرس الجديد',
    });

    expect(result.content).toBe('تم رفع الدرس الجديد');
    expect(notifications.notify).toHaveBeenCalledTimes(2);
    expect(notifications.notify).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'student-1', type: 'announcement' }),
    );
    expect(notifications.notify).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'student-2', type: 'announcement' }),
    );
  });

  it('rejects a teacher who does not own the course', async () => {
    await expect(
      service.createAnnouncement('course-1', makeUser({ id: 'someone-else' }), {
        content: 'محتوى',
      }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('rejects a student trying to post an announcement', async () => {
    await expect(
      service.createAnnouncement(
        'course-1',
        makeUser({ id: 'student-1', role: 'student' }),
        {
          content: 'محتوى',
        },
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('toggles pinnedAt on and off', async () => {
    const post = {
      id: 'post-1',
      courseId: 'course-1',
      teacherId: 'teacher-1',
      content: 'محتوى',
      pinnedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    postsRepository.findOne.mockResolvedValue(post);
    postsRepository.save.mockImplementation((input) => Promise.resolve(input));

    const pinned = await service.togglePin('post-1', makeUser());
    expect(pinned.isPinned).toBe(true);

    postsRepository.findOne.mockResolvedValue({
      ...post,
      pinnedAt: new Date(),
    });
    const unpinned = await service.togglePin('post-1', makeUser());
    expect(unpinned.isPinned).toBe(false);
  });
});
