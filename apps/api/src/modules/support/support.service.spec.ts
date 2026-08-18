import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test } from '@nestjs/testing';
import { NOTIFICATION_PRODUCER_PORT } from '../../common/ports/notification-producer.port';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { AttachmentsService } from '../attachments/attachments.service';
import { CourseEntity } from '../courses/entities/course.entity';
import { EnrollmentsService } from '../enrollments/enrollments.service';
import { FileEntity } from '../documents/entities/file.entity';
import { UserEntity } from '../users/entities/user.entity';
import { NotificationEntity } from '../notifications/entities/notification.entity';
import { SupportMessageEntity } from './entities/support-message.entity';
import { SupportTicketAttachmentEntity } from './entities/support-ticket-attachment.entity';
import { SupportTicketEntity } from './entities/support-ticket.entity';
import { SupportService } from './support.service';

function makeUser(
  overrides: Partial<AuthenticatedUser> = {},
): AuthenticatedUser {
  return {
    id: 'student-1',
    email: 'student@example.com',
    role: 'student',
    fullName: 'الطالب',
    avatarUrl: null,
    managedByTeacherId: null,
    ...overrides,
  };
}

describe('SupportService', () => {
  let service: SupportService;
  let ticketsRepository: Record<string, jest.Mock>;
  let messagesRepository: Record<string, jest.Mock>;
  let attachmentsJoinRepository: Record<string, jest.Mock>;
  let filesRepository: Record<string, jest.Mock>;
  let coursesRepository: Record<string, jest.Mock>;
  let usersRepository: Record<string, jest.Mock>;
  let notificationsRepository: Record<string, jest.Mock>;
  let enrollmentsService: { assertStudentEnrolled: jest.Mock };
  let attachmentsService: { saveAttachment: jest.Mock };
  let notifications: { notify: jest.Mock; markEntityRead: jest.Mock };

  const baseTicket: SupportTicketEntity = {
    id: 'ticket-1',
    studentId: 'student-1',
    courseId: null,
    isCourseChat: false,
    category: 'technical',
    subject: 'الفيديو بيتوقف',
    description: 'الفيديو بيتوقف عند الدقيقة 15',
    status: 'open',
    assignedTo: null,
    resolvedAt: null,
    closedAt: null,
    deletedAt: null,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  };

  beforeEach(async () => {
    ticketsRepository = {
      findOne: jest.fn(),
      find: jest.fn().mockResolvedValue([]),
      save: jest.fn(),
      create: jest.fn((input) => input),
      update: jest.fn(),
      createQueryBuilder: jest.fn(),
    };
    messagesRepository = {
      find: jest.fn().mockResolvedValue([]),
      save: jest.fn(),
      create: jest.fn((input) => input),
    };
    attachmentsJoinRepository = {
      find: jest.fn().mockResolvedValue([]),
      save: jest.fn(),
      create: jest.fn((input) => input),
    };
    filesRepository = { find: jest.fn().mockResolvedValue([]) };
    coursesRepository = {
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn(),
    };
    usersRepository = {
      find: jest
        .fn()
        .mockResolvedValue([{ id: 'student-1', fullName: 'الطالب' }]),
      findOne: jest
        .fn()
        .mockResolvedValue({ id: 'student-1', fullName: 'الطالب' }),
    };
    notificationsRepository = { find: jest.fn().mockResolvedValue([]) };
    enrollmentsService = {
      assertStudentEnrolled: jest.fn().mockResolvedValue(undefined),
    };
    attachmentsService = { saveAttachment: jest.fn() };
    notifications = {
      notify: jest.fn().mockResolvedValue(undefined),
      markEntityRead: jest.fn().mockResolvedValue(1),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        SupportService,
        {
          provide: getRepositoryToken(SupportTicketEntity),
          useValue: ticketsRepository,
        },
        {
          provide: getRepositoryToken(SupportMessageEntity),
          useValue: messagesRepository,
        },
        {
          provide: getRepositoryToken(SupportTicketAttachmentEntity),
          useValue: attachmentsJoinRepository,
        },
        { provide: getRepositoryToken(FileEntity), useValue: filesRepository },
        {
          provide: getRepositoryToken(CourseEntity),
          useValue: coursesRepository,
        },
        { provide: getRepositoryToken(UserEntity), useValue: usersRepository },
        {
          provide: getRepositoryToken(NotificationEntity),
          useValue: notificationsRepository,
        },
        { provide: EnrollmentsService, useValue: enrollmentsService },
        { provide: AttachmentsService, useValue: attachmentsService },
        { provide: NOTIFICATION_PRODUCER_PORT, useValue: notifications },
      ],
    }).compile();

    service = moduleRef.get(SupportService);
  });

  describe('createTicket', () => {
    it('lets a student create a ticket and notifies support staff', async () => {
      ticketsRepository.save.mockImplementation((input) =>
        Promise.resolve({ ...baseTicket, ...input, id: 'ticket-1' }),
      );
      usersRepository.find.mockResolvedValueOnce([
        { id: 'admin-1', fullName: 'Admin' },
        { id: 'teacher-1', fullName: 'Teacher' },
      ]);

      const result = await service.createTicket(makeUser(), {
        category: 'technical',
        subject: 'الفيديو بيتوقف',
        description: 'الفيديو بيتوقف عند الدقيقة 15',
      });

      expect(result.subject).toBe('الفيديو بيتوقف');
      expect(result.status).toBe('open');
      expect(notifications.notify).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'admin-1',
          type: 'support_ticket_update',
        }),
      );
      expect(notifications.notify).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'teacher-1',
          type: 'support_ticket_update',
        }),
      );
    });

    it('rejects an invalid category', async () => {
      await expect(
        service.createTicket(makeUser(), {
          category: 'not-a-real-category',
          subject: 'عنوان',
          description: 'وصف',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects an empty subject or description', async () => {
      await expect(
        service.createTicket(makeUser(), {
          category: 'technical',
          subject: '  ',
          description: 'وصف',
        }),
      ).rejects.toThrow('عنوان الطلب مطلوب.');

      await expect(
        service.createTicket(makeUser(), {
          category: 'technical',
          subject: 'عنوان',
          description: '  ',
        }),
      ).rejects.toThrow('وصف المشكلة مطلوب.');
    });

    it('verifies course enrollment when a courseId is provided', async () => {
      ticketsRepository.save.mockImplementation((input) =>
        Promise.resolve({ ...baseTicket, ...input, id: 'ticket-1' }),
      );

      await service.createTicket(makeUser(), {
        category: 'course',
        subject: 'عنوان',
        description: 'وصف',
        courseId: 'course-1',
      });

      expect(enrollmentsService.assertStudentEnrolled).toHaveBeenCalledWith(
        'student-1',
        'course-1',
      );
    });
  });

  describe('getTicket / access control', () => {
    it('lets the owning student view their own ticket', async () => {
      ticketsRepository.findOne.mockResolvedValue({ ...baseTicket });

      const result = await service.getTicket(
        'ticket-1',
        makeUser({ id: 'student-1' }),
      );

      expect(result.id).toBe('ticket-1');
    });

    it("rejects a different student from viewing someone else's ticket", async () => {
      ticketsRepository.findOne.mockResolvedValue({
        ...baseTicket,
        studentId: 'student-1',
      });

      await expect(
        service.getTicket('ticket-1', makeUser({ id: 'student-2' })),
      ).rejects.toThrow(ForbiddenException);
    });

    it('lets support staff (admin/teacher/assistant) view any ticket', async () => {
      ticketsRepository.findOne.mockResolvedValue({ ...baseTicket });

      await expect(
        service.getTicket(
          'ticket-1',
          makeUser({ id: 'admin-1', role: 'admin' }),
        ),
      ).resolves.toMatchObject({ id: 'ticket-1' });
      await expect(
        service.getTicket(
          'ticket-1',
          makeUser({ id: 'assistant-1', role: 'assistant' }),
        ),
      ).resolves.toMatchObject({ id: 'ticket-1' });
    });

    it('throws NotFoundException for a missing ticket', async () => {
      ticketsRepository.findOne.mockResolvedValue(null);

      await expect(service.getTicket('missing', makeUser())).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('addMessage', () => {
    it('marks a staff reply and notifies the student', async () => {
      ticketsRepository.findOne.mockResolvedValue({ ...baseTicket });
      messagesRepository.save.mockImplementation((input) =>
        Promise.resolve({ ...input, id: 'message-1', createdAt: new Date() }),
      );

      const staff = makeUser({
        id: 'teacher-1',
        role: 'teacher',
        fullName: 'المدرس',
      });
      const result = await service.addMessage('ticket-1', staff, {
        body: 'جربنا إعادة المعالجة',
      });

      expect(result.isStaffReply).toBe(true);
      expect(notifications.notify).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'student-1',
          type: 'support_ticket_update',
        }),
      );
    });

    it('rejects a message from a student who does not own the ticket', async () => {
      ticketsRepository.findOne.mockResolvedValue({
        ...baseTicket,
        studentId: 'student-1',
      });

      await expect(
        service.addMessage('ticket-1', makeUser({ id: 'student-2' }), {
          body: 'رد',
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('course chats', () => {
    const course = {
      id: 'course-1',
      teacherId: 'teacher-1',
      title: 'الفيزياء',
      deletedAt: null,
    } as CourseEntity;
    const courseChat = {
      ...baseTicket,
      courseId: 'course-1',
      isCourseChat: true,
      category: 'course' as const,
      subject: 'متابعة دورة الفيزياء',
    };

    it('returns the same chat to the teacher and their assistant', async () => {
      coursesRepository.findOne.mockResolvedValue(course);
      ticketsRepository.findOne.mockResolvedValue(courseChat);

      const teacherResult = await service.openCourseChat(
        'course-1',
        'student-1',
        makeUser({ id: 'teacher-1', role: 'teacher' }),
      );
      const assistantResult = await service.openCourseChat(
        'course-1',
        'student-1',
        makeUser({
          id: 'assistant-1',
          role: 'assistant',
          managedByTeacherId: 'teacher-1',
        }),
      );

      expect(teacherResult.id).toBe('ticket-1');
      expect(assistantResult.id).toBe('ticket-1');
      expect(ticketsRepository.save).not.toHaveBeenCalled();
      expect(enrollmentsService.assertStudentEnrolled).toHaveBeenCalledTimes(2);
    });

    it("rejects an assistant assigned to another teacher's course", async () => {
      coursesRepository.findOne.mockResolvedValue(course);

      await expect(
        service.openCourseChat(
          'course-1',
          'student-1',
          makeUser({
            id: 'assistant-2',
            role: 'assistant',
            managedByTeacherId: 'teacher-2',
          }),
        ),
      ).rejects.toThrow(ForbiddenException);
      expect(enrollmentsService.assertStudentEnrolled).not.toHaveBeenCalled();
    });
  });

  describe('listMyTickets', () => {
    it('returns student tickets and flags unread tickets correctly', async () => {
      ticketsRepository.find.mockResolvedValue([baseTicket]);
      notificationsRepository.find.mockResolvedValue([
        { relatedEntityId: 'ticket-1', isRead: false },
      ]);

      const result = await service.listMyTickets(makeUser());

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('ticket-1');
      expect(result[0].hasUnread).toBe(true);
    });
  });

  describe('updateStatus', () => {
    it("lets support staff change a ticket's status", async () => {
      ticketsRepository.findOne.mockResolvedValue({ ...baseTicket });
      ticketsRepository.save.mockImplementation((input) =>
        Promise.resolve(input),
      );

      const result = await service.updateStatus(
        'ticket-1',
        makeUser({ id: 'admin-1', role: 'admin' }),
        { status: 'resolved' },
      );

      expect(result.status).toBe('resolved');
      expect(notifications.notify).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'student-1',
          type: 'support_ticket_update',
        }),
      );
    });

    it('rejects a student trying to change ticket status', async () => {
      ticketsRepository.findOne.mockResolvedValue({ ...baseTicket });

      await expect(
        service.updateStatus('ticket-1', makeUser({ id: 'student-1' }), {
          status: 'resolved',
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
