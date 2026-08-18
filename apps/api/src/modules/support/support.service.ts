import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Repository } from 'typeorm';
import { NOTIFICATION_PRODUCER_PORT } from '../../common/ports/notification-producer.port';
import type { NotificationProducerPort } from '../../common/ports/notification-producer.port';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { AttachmentsService } from '../attachments/attachments.service';
import { CourseEntity } from '../courses/entities/course.entity';
import { FileEntity } from '../documents/entities/file.entity';
import { EnrollmentsService } from '../enrollments/enrollments.service';
import { UserEntity } from '../users/entities/user.entity';
import { NotificationEntity } from '../notifications/entities/notification.entity';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { SupportMessageEntity } from './entities/support-message.entity';
import { SupportTicketAttachmentEntity } from './entities/support-ticket-attachment.entity';
import {
  SupportTicketCategory,
  SupportTicketEntity,
  SupportTicketStatus,
} from './entities/support-ticket.entity';

const MAX_SUBJECT_LENGTH = 200;
const MAX_DESCRIPTION_LENGTH = 10_000;
const TICKET_CATEGORIES: SupportTicketCategory[] = [
  'technical',
  'course',
  'payment',
  'account',
  'other',
];

export interface SupportStaffSummary {
  id: string;
  fullName: string;
}

export interface SupportMessageResponse {
  id: string;
  authorName: string;
  authorAvatarUrl: string | null;
  isStaffReply: boolean;
  body: string;
  createdAt: string;
}

export interface SupportTicketAttachmentResponse {
  id: string;
  fileName: string;
  mimeType: string;
}

export interface SupportTicketListItemResponse {
  id: string;
  category: SupportTicketCategory;
  subject: string;
  status: SupportTicketStatus;
  courseTitle: string | null;
  studentName: string;
  createdAt: string;
  updatedAt: string;
  hasUnread: boolean;
  isCourseChat: boolean;
}

export interface SupportTicketDetailResponse extends SupportTicketListItemResponse {
  description: string;
  attachments: SupportTicketAttachmentResponse[];
  messages: SupportMessageResponse[];
}

export interface CreateTicketInput {
  category: string;
  subject: string;
  description: string;
  courseId?: string;
  attachment?: {
    buffer: Buffer;
    originalName: string;
    mimeType: string;
    sizeBytes: number;
  };
}

export interface StaffTicketListFilters {
  status?: SupportTicketStatus;
  category?: SupportTicketCategory;
  courseId?: string;
  search?: string;
}

@Injectable()
export class SupportService {
  constructor(
    @InjectRepository(SupportTicketEntity)
    private readonly ticketsRepository: Repository<SupportTicketEntity>,
    @InjectRepository(SupportMessageEntity)
    private readonly messagesRepository: Repository<SupportMessageEntity>,
    @InjectRepository(SupportTicketAttachmentEntity)
    private readonly attachmentsJoinRepository: Repository<SupportTicketAttachmentEntity>,
    @InjectRepository(FileEntity)
    private readonly filesRepository: Repository<FileEntity>,
    @InjectRepository(CourseEntity)
    private readonly coursesRepository: Repository<CourseEntity>,
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
    @InjectRepository(NotificationEntity)
    private readonly notificationsRepository: Repository<NotificationEntity>,
    private readonly enrollmentsService: EnrollmentsService,
    private readonly attachmentsService: AttachmentsService,
    @Inject(NOTIFICATION_PRODUCER_PORT)
    private readonly notifications: NotificationProducerPort,
  ) {}

  async createTicket(
    user: AuthenticatedUser,
    input: CreateTicketInput,
  ): Promise<SupportTicketDetailResponse> {
    if (!TICKET_CATEGORIES.includes(input.category as SupportTicketCategory)) {
      throw new BadRequestException('نوع المشكلة غير صحيح.');
    }
    const subject = input.subject.trim();
    const description = input.description.trim();
    if (!subject) throw new BadRequestException('عنوان الطلب مطلوب.');
    if (!description) throw new BadRequestException('وصف المشكلة مطلوب.');
    if (subject.length > MAX_SUBJECT_LENGTH) {
      throw new BadRequestException('عنوان الطلب طويل جدًا.');
    }
    if (description.length > MAX_DESCRIPTION_LENGTH) {
      throw new BadRequestException('وصف المشكلة طويل جدًا.');
    }

    let courseId: string | null = null;
    if (input.courseId) {
      await this.enrollmentsService.assertStudentEnrolled(
        user.id,
        input.courseId,
      );
      courseId = input.courseId;
    }

    const ticket = await this.ticketsRepository.save(
      this.ticketsRepository.create({
        studentId: user.id,
        courseId,
        category: input.category as SupportTicketCategory,
        subject,
        description,
        status: 'open',
      }),
    );

    if (input.attachment) {
      const file = await this.attachmentsService.saveAttachment({
        buffer: input.attachment.buffer,
        originalName: input.attachment.originalName,
        mimeType: input.attachment.mimeType,
        sizeBytes: input.attachment.sizeBytes,
        uploadedById: user.id,
      });
      await this.attachmentsJoinRepository.save(
        this.attachmentsJoinRepository.create({
          ticketId: ticket.id,
          fileId: file.id,
          orderIndex: 0,
        }),
      );
    }

    await this.notifySupportStaff(
      ticket.id,
      `طلب دعم جديد: ${subject}`,
      `${user.fullName} فتح طلب دعم فني (${input.category}).`,
    );

    return this.toDetailResponse(ticket, user.id);
  }

  async listMyTickets(
    user: AuthenticatedUser,
    status?: SupportTicketStatus,
  ): Promise<SupportTicketListItemResponse[]> {
    const tickets = await this.ticketsRepository.find({
      where: {
        studentId: user.id,
        deletedAt: IsNull(),
        ...(status ? { status } : {}),
      },
      order: { createdAt: 'DESC' },
      take: 100,
    });
    return this.toListResponses(tickets, user.id);
  }

  async listStaffTickets(
    filters: StaffTicketListFilters,
    user?: AuthenticatedUser,
  ): Promise<SupportTicketListItemResponse[]> {
    const qb = this.ticketsRepository
      .createQueryBuilder('t')
      .where('t.deletedAt IS NULL');

    if (user?.role === 'teacher') {
      qb.andWhere(
        '(t.isCourseChat = false OR EXISTS (SELECT 1 FROM courses c WHERE c.id = t.course_id AND c.teacher_id = :teacherId AND c.deleted_at IS NULL))',
        {
          teacherId: user.id,
        },
      );
    } else if (user?.role === 'assistant') {
      qb.andWhere(
        '(t.isCourseChat = false OR EXISTS (SELECT 1 FROM courses c WHERE c.id = t.course_id AND c.teacher_id = :teacherId AND c.deleted_at IS NULL))',
        {
          teacherId: user.managedByTeacherId,
        },
      );
    }

    if (filters.status)
      qb.andWhere('t.status = :status', { status: filters.status });
    if (filters.category)
      qb.andWhere('t.category = :category', { category: filters.category });
    if (filters.courseId)
      qb.andWhere('t.courseId = :courseId', { courseId: filters.courseId });
    if (filters.search) {
      qb.andWhere('(t.subject ILIKE :search OR t.description ILIKE :search)', {
        search: `%${filters.search}%`,
      });
    }

    qb.orderBy('t.createdAt', 'DESC').take(200);
    const tickets = await qb.getMany();
    return this.toListResponses(tickets, user?.id);
  }

  async getTicket(
    ticketId: string,
    user: AuthenticatedUser,
  ): Promise<SupportTicketDetailResponse> {
    const ticket = await this.loadTicketOrThrow(ticketId);
    await this.assertCanAccessTicket(ticket, user);

    this.notifications
      .markEntityRead?.(user.id, 'support_ticket', ticketId)
      ?.catch(() => {});

    return this.toDetailResponse(ticket);
  }

  async addMessage(
    ticketId: string,
    user: AuthenticatedUser,
    dto: CreateMessageDto,
  ): Promise<SupportMessageResponse> {
    const ticket = await this.loadTicketOrThrow(ticketId);
    await this.assertCanAccessTicket(ticket, user);

    const isStaff = this.isSupportStaff(user);
    const message = await this.messagesRepository.save(
      this.messagesRepository.create({
        ticketId,
        authorId: user.id,
        isStaffReply: isStaff,
        body: dto.body.trim(),
      }),
    );

    await this.ticketsRepository.update(ticketId, { updatedAt: new Date() });

    if (isStaff) {
      this.notifications
        .notify({
          userId: ticket.studentId,
          type: 'support_ticket_update',
          title: 'رد جديد على طلب الدعم',
          message: `في رد جديد على طلبك: ${ticket.subject}`,
          relatedEntityType: 'support_ticket',
          relatedEntityId: ticketId,
        })
        .catch(() => {});
    } else if (ticket.isCourseChat && ticket.courseId) {
      await this.notifyCourseStaff(
        ticket,
        'رسالة جديدة من الطالب',
        `${user.fullName} أرسل رسالة في محادثة الدورة.`,
        user.id,
      );
    } else if (ticket.assignedTo) {
      this.notifications
        .notify({
          userId: ticket.assignedTo,
          type: 'support_ticket_update',
          title: 'رد جديد من الطالب',
          message: `${user.fullName} رد على طلب الدعم: ${ticket.subject}`,
          relatedEntityType: 'support_ticket',
          relatedEntityId: ticketId,
        })
        .catch(() => {});
    } else {
      await this.notifySupportStaff(
        ticketId,
        'رد جديد من الطالب',
        `${user.fullName} رد على طلب الدعم: ${ticket.subject}`,
      );
    }

    const author = await this.usersRepository.findOne({
      where: { id: user.id },
    });
    return {
      id: message.id,
      authorName: author?.fullName ?? 'مستخدم محذوف',
      authorAvatarUrl: author?.avatarUrl ?? null,
      isStaffReply: message.isStaffReply,
      body: message.body,
      createdAt: message.createdAt.toISOString(),
    };
  }

  async updateStatus(
    ticketId: string,
    user: AuthenticatedUser,
    dto: UpdateStatusDto,
  ): Promise<SupportTicketDetailResponse> {
    const ticket = await this.loadTicketOrThrow(ticketId);
    if (!this.isSupportStaff(user)) {
      throw new ForbiddenException('Support staff only.');
    }
    await this.assertCanAccessTicket(ticket, user);

    ticket.status = dto.status;
    ticket.assignedTo = ticket.assignedTo ?? user.id;
    ticket.resolvedAt =
      dto.status === 'resolved' ? new Date() : ticket.resolvedAt;
    ticket.closedAt = dto.status === 'closed' ? new Date() : ticket.closedAt;
    await this.ticketsRepository.save(ticket);

    this.notifications
      .notify({
        userId: ticket.studentId,
        type: 'support_ticket_update',
        title: 'تحديث حالة طلب الدعم',
        message: `تم تحديث حالة طلبك "${ticket.subject}" إلى ${this.statusLabel(dto.status)}.`,
        relatedEntityType: 'support_ticket',
        relatedEntityId: ticketId,
      })
      .catch(() => {});

    return this.toDetailResponse(ticket);
  }

  async openCourseChat(
    courseId: string,
    studentId: string,
    user: AuthenticatedUser,
  ): Promise<SupportTicketDetailResponse> {
    const course = await this.assertCourseStaffAccess(courseId, user);
    await this.enrollmentsService.assertStudentEnrolled(studentId, courseId);

    let ticket = await this.ticketsRepository.findOne({
      where: {
        studentId,
        courseId,
        isCourseChat: true,
        deletedAt: IsNull(),
      },
    });

    if (!ticket) {
      ticket = await this.ticketsRepository.save(
        this.ticketsRepository.create({
          studentId,
          courseId,
          isCourseChat: true,
          category: 'course',
          subject: `متابعة دورة ${course.title}`,
          description: 'محادثة مباشرة بين الطالب وفريق الدورة.',
          status: 'open',
          assignedTo: null,
        }),
      );
    }

    return this.toDetailResponse(ticket, user.id);
  }

  async ensureCourseChatForIntervention(input: {
    studentId: string;
    courseId: string;
    courseTitle: string;
    weakConcept: string;
  }): Promise<string> {
    let ticket = await this.ticketsRepository.findOne({
      where: {
        studentId: input.studentId,
        courseId: input.courseId,
        isCourseChat: true,
        deletedAt: IsNull(),
      },
    });

    const subject = `طالب محتاج متابعة: ${input.weakConcept}`;
    const description =
      `رصد النظام أن الطالب محتاج متابعة في "${input.weakConcept}" داخل دورة ${input.courseTitle}. ` +
      'يمكن للمدرس أو الأسيستانت التواصل معه من المحادثة بالأسفل.';

    if (ticket) {
      ticket.subject = subject;
      ticket.description = description;
      ticket.status = 'open';
      ticket.closedAt = null;
      ticket.resolvedAt = null;
      ticket = await this.ticketsRepository.save(ticket);
    } else {
      try {
        ticket = await this.ticketsRepository.save(
          this.ticketsRepository.create({
            studentId: input.studentId,
            courseId: input.courseId,
            isCourseChat: true,
            category: 'course',
            subject,
            description,
            status: 'open',
            assignedTo: null,
          }),
        );
      } catch (error) {
        if (!this.isUniqueViolation(error)) throw error;
        ticket = await this.ticketsRepository.findOne({
          where: {
            studentId: input.studentId,
            courseId: input.courseId,
            isCourseChat: true,
            deletedAt: IsNull(),
          },
        });
        if (!ticket) throw error;
      }
    }

    await this.notifyCourseStaff(
      ticket,
      'طالب محتاج متابعة',
      `${subject} في دورة ${input.courseTitle}.`,
    );
    return ticket.id;
  }

  // ---------------------------------------------------------------------

  private async loadTicketOrThrow(
    ticketId: string,
  ): Promise<SupportTicketEntity> {
    const ticket = await this.ticketsRepository.findOne({
      where: { id: ticketId, deletedAt: IsNull() },
    });
    if (!ticket) {
      throw new NotFoundException('Support ticket not found.');
    }
    return ticket;
  }

  private isSupportStaff(user: AuthenticatedUser): boolean {
    return (
      user.role === 'admin' ||
      user.role === 'teacher' ||
      user.role === 'assistant'
    );
  }

  // A student may only ever see their own ticket, by ID — never another
  // student's, even with a valid ticket ID. Support staff can see any.
  private async assertCanAccessTicket(
    ticket: SupportTicketEntity,
    user: AuthenticatedUser,
  ): Promise<void> {
    if (ticket.isCourseChat && ticket.courseId && user.role !== 'admin') {
      if (user.role === 'student' && ticket.studentId === user.id) return;
      await this.assertCourseStaffAccess(ticket.courseId, user);
      return;
    }
    if (this.isSupportStaff(user)) return;
    if (ticket.studentId !== user.id) {
      throw new ForbiddenException('You do not own this support ticket.');
    }
  }

  private async assertCourseStaffAccess(
    courseId: string,
    user: AuthenticatedUser,
  ): Promise<CourseEntity> {
    const course = await this.coursesRepository.findOne({
      where: { id: courseId, deletedAt: IsNull() },
    });
    if (!course) throw new NotFoundException('Course not found.');

    const teacherId =
      user.role === 'teacher'
        ? user.id
        : user.role === 'assistant'
          ? user.managedByTeacherId
          : null;
    if (!teacherId || course.teacherId !== teacherId) {
      throw new ForbiddenException('You cannot access this course chat.');
    }
    return course;
  }

  private async notifyCourseStaff(
    ticket: SupportTicketEntity,
    title: string,
    message: string,
    excludeUserId?: string,
  ): Promise<void> {
    if (!ticket.courseId) return;
    const course = await this.coursesRepository.findOne({
      where: { id: ticket.courseId },
      select: { teacherId: true },
    });
    if (!course) return;
    const assistants = await this.usersRepository.find({
      where: {
        role: 'assistant',
        managedByTeacherId: course.teacherId,
        deletedAt: IsNull(),
      },
      select: { id: true },
    });
    const recipientIds = new Set([
      course.teacherId,
      ...assistants.map((assistant) => assistant.id),
    ]);
    if (excludeUserId) recipientIds.delete(excludeUserId);
    await Promise.allSettled(
      [...recipientIds].map((userId) =>
        this.notifications.notify({
          userId,
          type: 'support_ticket_update',
          title,
          message,
          relatedEntityType: 'support_ticket',
          relatedEntityId: ticket.id,
        }),
      ),
    );
  }

  private isUniqueViolation(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: string }).code === '23505'
    );
  }

  private statusLabel(status: SupportTicketStatus): string {
    const labels: Record<SupportTicketStatus, string> = {
      open: 'مفتوح',
      in_progress: 'قيد المعالجة',
      waiting_for_student: 'بانتظار ردك',
      resolved: 'تم الحل',
      closed: 'مغلق',
    };
    return labels[status];
  }

  private async notifySupportStaff(
    ticketId: string,
    title: string,
    message: string,
  ): Promise<void> {
    const staff = await this.usersRepository.find({
      where: { role: In(['admin', 'teacher', 'assistant']) },
      select: { id: true },
    });
    await Promise.allSettled(
      staff.map((s) =>
        this.notifications.notify({
          userId: s.id,
          type: 'support_ticket_update',
          title,
          message,
          relatedEntityType: 'support_ticket',
          relatedEntityId: ticketId,
        }),
      ),
    );
  }

  private async toListResponses(
    tickets: SupportTicketEntity[],
    userId?: string,
  ): Promise<SupportTicketListItemResponse[]> {
    if (tickets.length === 0) return [];

    const ticketIds = tickets.map((t) => t.id);
    const studentIds = Array.from(new Set(tickets.map((t) => t.studentId)));
    const courseIds = Array.from(
      new Set(
        tickets.map((t) => t.courseId).filter((id): id is string => !!id),
      ),
    );

    const [students, courses, unreadNotifs] = await Promise.all([
      this.usersRepository.find({
        where: { id: In(studentIds) },
        select: { id: true, fullName: true },
      }),
      courseIds.length
        ? this.coursesRepository.find({
            where: { id: In(courseIds) },
            select: { id: true, title: true },
          })
        : Promise.resolve([]),
      userId && ticketIds.length
        ? this.notificationsRepository.find({
            where: {
              userId,
              isRead: false,
              relatedEntityType: 'support_ticket',
              relatedEntityId: In(ticketIds),
              deletedAt: IsNull(),
            },
            select: { relatedEntityId: true },
          })
        : Promise.resolve([]),
    ]);

    const studentsById = new Map(students.map((s) => [s.id, s]));
    const coursesById = new Map(courses.map((c) => [c.id, c]));
    const unreadTicketIds = new Set(
      unreadNotifs
        .map((n) => n.relatedEntityId)
        .filter((id): id is string => !!id),
    );

    return tickets.map((t) => ({
      id: t.id,
      category: t.category,
      subject: t.subject,
      status: t.status,
      courseTitle: t.courseId
        ? (coursesById.get(t.courseId)?.title ?? null)
        : null,
      studentName: studentsById.get(t.studentId)?.fullName ?? 'مستخدم محذوف',
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
      hasUnread: unreadTicketIds.has(t.id),
      isCourseChat: t.isCourseChat,
    }));
  }

  private async toDetailResponse(
    ticket: SupportTicketEntity,
    userId?: string,
  ): Promise<SupportTicketDetailResponse> {
    const [listItem] = await this.toListResponses([ticket], userId);

    const [messages, attachmentRows] = await Promise.all([
      this.messagesRepository.find({
        where: { ticketId: ticket.id },
        order: { createdAt: 'ASC' },
      }),
      this.attachmentsJoinRepository.find({ where: { ticketId: ticket.id } }),
    ]);

    const authorIds = Array.from(new Set(messages.map((m) => m.authorId)));
    const authors = authorIds.length
      ? await this.usersRepository.find({
          where: { id: In(authorIds) },
          select: { id: true, fullName: true, avatarUrl: true },
        })
      : [];
    const authorsById = new Map(authors.map((a) => [a.id, a]));

    const files = attachmentRows.length
      ? await this.filesRepository.find({
          where: { id: In(attachmentRows.map((a) => a.fileId)) },
        })
      : [];

    return {
      ...listItem,
      description: ticket.description,
      attachments: files.map((f) => ({
        id: f.id,
        fileName: f.fileName,
        mimeType: f.mimeType,
      })),
      messages: messages.map((m) => ({
        id: m.id,
        authorName: authorsById.get(m.authorId)?.fullName ?? 'مستخدم محذوف',
        authorAvatarUrl: authorsById.get(m.authorId)?.avatarUrl ?? null,
        isStaffReply: m.isStaffReply,
        body: m.body,
        createdAt: m.createdAt.toISOString(),
      })),
    };
  }
}
