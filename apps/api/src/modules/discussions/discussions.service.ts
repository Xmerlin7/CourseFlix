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
import type {
  AuthenticatedUser,
  UserRole,
} from '../auth/interfaces/authenticated-user.interface';
import { CourseEntity } from '../courses/entities/course.entity';
import { EnrollmentsService } from '../enrollments/enrollments.service';
import { UserEntity } from '../users/entities/user.entity';
import { AttachmentsService } from '../attachments/attachments.service';
import { FileEntity } from '../documents/entities/file.entity';
import { NotificationEntity } from '../notifications/entities/notification.entity';
import { CreateReplyDto } from './dto/create-reply.dto';
import { DiscussionHelpfulVoteEntity } from './entities/discussion-helpful-vote.entity';
import { DiscussionReplyEntity } from './entities/discussion-reply.entity';
import { DiscussionThreadAttachmentEntity } from './entities/discussion-thread-attachment.entity';
import { DiscussionThreadEntity } from './entities/discussion-thread.entity';

const MAX_TITLE_LENGTH = 200;
const MAX_BODY_LENGTH = 10_000;
const MAX_TAGS = 5;
const MAX_TAG_LENGTH = 30;

export type DiscussionStatusFilter = 'all' | 'answered' | 'unanswered' | 'mine';

export interface DiscussionListFilters {
  status?: DiscussionStatusFilter;
  search?: string;
  tag?: string;
}

export interface DiscussionAuthorSummary {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  role: UserRole;
}

export interface DiscussionAttachmentResponse {
  id: string;
  fileName: string;
  mimeType: string;
}

export interface DiscussionThreadListItemResponse {
  id: string;
  courseId: string;
  title: string;
  body: string;
  author: DiscussionAuthorSummary;
  tags: string[];
  replyCount: number;
  helpfulCount: number;
  isHelpfulByMe: boolean;
  isPinned: boolean;
  isAnswered: boolean;
  createdAt: string;
  hasUnread: boolean;
}

export interface DiscussionReplyResponse {
  id: string;
  author: DiscussionAuthorSummary;
  body: string;
  isAccepted: boolean;
  createdAt: string;
}

export interface DiscussionThreadDetailResponse extends DiscussionThreadListItemResponse {
  body: string;
  attachments: DiscussionAttachmentResponse[];
  replies: DiscussionReplyResponse[];
  canAccept: boolean;
  canPin: boolean;
}

export interface LatestThreadByCourse {
  authorName: string;
  title: string;
  createdAt: Date;
}

export interface CreateThreadInput {
  title: string;
  body: string;
  tags: string[];
  attachment?: {
    buffer: Buffer;
    originalName: string;
    mimeType: string;
    sizeBytes: number;
  };
}

/**
 * A thread is only reachable through a course, and every method here
 * re-derives the course from the thread and re-checks access — never
 * trusts a courseId the caller already "knows" from a previous call.
 */
@Injectable()
export class DiscussionsService {
  constructor(
    @InjectRepository(DiscussionThreadEntity)
    private readonly threadsRepository: Repository<DiscussionThreadEntity>,
    @InjectRepository(DiscussionReplyEntity)
    private readonly repliesRepository: Repository<DiscussionReplyEntity>,
    @InjectRepository(DiscussionHelpfulVoteEntity)
    private readonly helpfulVotesRepository: Repository<DiscussionHelpfulVoteEntity>,
    @InjectRepository(DiscussionThreadAttachmentEntity)
    private readonly attachmentsJoinRepository: Repository<DiscussionThreadAttachmentEntity>,
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

  async listThreads(
    courseId: string,
    user: AuthenticatedUser,
    filters: DiscussionListFilters,
  ): Promise<DiscussionThreadListItemResponse[]> {
    await this.assertCanAccessCourse(user, courseId);

    const qb = this.threadsRepository
      .createQueryBuilder('t')
      .where('t.courseId = :courseId', { courseId })
      .andWhere('t.deletedAt IS NULL');

    if (filters.status === 'answered') {
      qb.andWhere('t.acceptedReplyId IS NOT NULL');
    } else if (filters.status === 'unanswered') {
      qb.andWhere('t.acceptedReplyId IS NULL');
    } else if (filters.status === 'mine') {
      qb.andWhere('t.authorId = :userId', { userId: user.id });
    }

    if (filters.tag) {
      qb.andWhere(':tag = ANY(t.tags)', { tag: filters.tag });
    }

    if (filters.search) {
      qb.andWhere(
        '(t.title ILIKE :search OR t.body ILIKE :search OR EXISTS (SELECT 1 FROM unnest(t.tags) AS tg WHERE tg ILIKE :search))',
        { search: `%${filters.search}%` },
      );
    }

    qb.orderBy('t.isPinned', 'DESC')
      .addOrderBy('t.createdAt', 'DESC')
      .take(100);

    const threads = await qb.getMany();
    const threadIds = threads.map((t) => t.id);
    const [authors, helpfulThreadIds, unreadNotifs] = await Promise.all([
      this.loadAuthors(threads.map((t) => t.authorId)),
      this.loadHelpfulThreadIds(user.id, threadIds),
      threadIds.length
        ? this.notificationsRepository.find({
            where: {
              userId: user.id,
              isRead: false,
              relatedEntityType: 'discussion_thread',
              relatedEntityId: In(threadIds),
              deletedAt: IsNull(),
            },
            select: { relatedEntityId: true },
          })
        : Promise.resolve([]),
    ]);

    const unreadThreadIds = new Set(
      unreadNotifs
        .map((n) => n.relatedEntityId)
        .filter((id): id is string => !!id),
    );

    return threads.map((t) =>
      this.toListItem(t, authors, helpfulThreadIds, unreadThreadIds),
    );
  }

  async getThread(
    threadId: string,
    user: AuthenticatedUser,
  ): Promise<DiscussionThreadDetailResponse> {
    const thread = await this.loadThreadOrThrow(threadId);
    const course = await this.assertCanAccessCourse(user, thread.courseId);

    const [replies, attachmentRows, helpfulThreadIds] = await Promise.all([
      this.repliesRepository.find({
        where: { threadId, deletedAt: IsNull() },
        order: { createdAt: 'ASC' },
      }),
      this.attachmentsJoinRepository.find({ where: { threadId } }),
      this.loadHelpfulThreadIds(user.id, [threadId]),
    ]);

    const authorIds = [thread.authorId, ...replies.map((r) => r.authorId)];
    const authors = await this.loadAuthors(authorIds);

    const files = attachmentRows.length
      ? await this.filesRepository.find({
          where: { id: In(attachmentRows.map((a) => a.fileId)) },
        })
      : [];

    const isTeacherOfCourse = this.isEffectiveTeacher(user, course);

    this.notifications
      .markEntityRead?.(user.id, 'discussion_thread', threadId)
      ?.catch(() => {});

    return {
      ...this.toListItem(thread, authors, helpfulThreadIds),
      body: thread.body,
      attachments: files.map((f) => ({
        id: f.id,
        fileName: f.fileName,
        mimeType: f.mimeType,
      })),
      replies: replies.map((r) => ({
        id: r.id,
        author: this.resolveAuthor(r.authorId, r.authorRole, authors),
        body: r.body,
        isAccepted: Boolean(r.isAccepted),
        createdAt: r.createdAt.toISOString(),
      })),
      canAccept: isTeacherOfCourse,
      canPin: isTeacherOfCourse,
    };
  }

  async markCourseDiscussionsRead(
    courseId: string,
    user: AuthenticatedUser,
  ): Promise<{ updated: number }> {
    await this.assertCanAccessCourse(user, courseId);
    const threads = await this.threadsRepository.find({
      where: { courseId, deletedAt: IsNull() },
      select: { id: true },
    });
    const threadIds = threads.map((t) => t.id);
    if (threadIds.length === 0) return { updated: 0 };

    const updated =
      (await this.notifications.markEntitiesRead?.(
        user.id,
        'discussion_thread',
        threadIds,
      )) ?? 0;
    return { updated };
  }

  async createThread(
    courseId: string,
    user: AuthenticatedUser,
    input: CreateThreadInput,
  ): Promise<DiscussionThreadDetailResponse> {
    if (user.role !== 'student') {
      throw new ForbiddenException('Only students can ask questions.');
    }
    const course = await this.assertCanAccessCourse(user, courseId);

    const title = (input.title || '').trim();
    if (!title) throw new BadRequestException('عنوان السؤال مطلوب.');
    if (title.length > MAX_TITLE_LENGTH) {
      throw new BadRequestException('عنوان السؤال طويل جدًا.');
    }

    const body = (input.body || '').trim();
    if (!body) throw new BadRequestException('تفاصيل السؤال مطلوبة.');
    if (body.length > MAX_BODY_LENGTH) {
      throw new BadRequestException('تفاصيل السؤال طويلة جدًا.');
    }

    const tags = this.normalizeTags(input.tags);

    const thread = await this.threadsRepository.save(
      this.threadsRepository.create({
        courseId,
        authorId: user.id,
        authorRole: user.role,
        title,
        body,
        tags,
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
          threadId: thread.id,
          fileId: file.id,
          orderIndex: 0,
        }),
      );
    }

    const assistants = await this.usersRepository.find({
      where: {
        role: 'assistant',
        managedByTeacherId: course.teacherId,
        deletedAt: IsNull(),
      },
      select: { id: true },
    });
    const staffIds = Array.from(
      new Set([course.teacherId, ...assistants.map((a) => a.id)]),
    ).filter((id) => id !== user.id);

    for (const staffId of staffIds) {
      this.notifications
        .notify({
          userId: staffId,
          type: 'discussion_reply',
          title: 'سؤال جديد في المجتمع',
          message: `${user.fullName} سأل: ${title}`,
          relatedEntityType: 'discussion_thread',
          relatedEntityId: thread.id,
        })
        .catch(() => {});
    }

    return this.getThread(thread.id, user);
  }

  async createReply(
    threadId: string,
    user: AuthenticatedUser,
    dto: CreateReplyDto,
  ): Promise<DiscussionReplyResponse> {
    const thread = await this.loadThreadOrThrow(threadId);
    await this.assertCanAccessCourse(user, thread.courseId);

    const reply = await this.repliesRepository.save(
      this.repliesRepository.create({
        threadId,
        authorId: user.id,
        authorRole: user.role,
        body: dto.body.trim(),
        isAccepted: false,
      }),
    );

    await this.threadsRepository.increment({ id: threadId }, 'replyCount', 1);

    const course = await this.coursesRepository.findOne({
      where: { id: thread.courseId },
      select: { id: true, teacherId: true },
    });

    const recipientIds = new Set<string>();
    if (thread.authorId) recipientIds.add(thread.authorId);
    if (course?.teacherId) {
      recipientIds.add(course.teacherId);
      const assistants = await this.usersRepository.find({
        where: {
          role: 'assistant',
          managedByTeacherId: course.teacherId,
          deletedAt: IsNull(),
        },
        select: { id: true },
      });
      assistants.forEach((a) => recipientIds.add(a.id));
    }

    const previousReplies = await this.repliesRepository.find({
      where: { threadId, deletedAt: IsNull() },
      select: { authorId: true },
    });
    previousReplies.forEach((r) => recipientIds.add(r.authorId));

    recipientIds.delete(user.id);

    for (const recipientId of recipientIds) {
      this.notifications
        .notify({
          userId: recipientId,
          type: 'discussion_reply',
          title:
            recipientId === thread.authorId
              ? 'رد جديد على سؤالك'
              : 'نشاط جديد في المناقشة',
          message: `${user.fullName} رد على: ${thread.title}`,
          relatedEntityType: 'discussion_thread',
          relatedEntityId: threadId,
        })
        .catch(() => {});
    }

    const authors = await this.loadAuthors([user.id]);
    return {
      id: reply.id,
      author: this.resolveAuthor(user.id, user.role, authors),
      body: reply.body,
      isAccepted: false,
      createdAt: reply.createdAt.toISOString(),
    };
  }

  async acceptAnswer(
    threadId: string,
    replyId: string,
    user: AuthenticatedUser,
  ): Promise<DiscussionThreadDetailResponse> {
    const thread = await this.loadThreadOrThrow(threadId);
    const course = await this.assertCanAccessCourse(user, thread.courseId);

    if (!this.isEffectiveTeacher(user, course)) {
      throw new ForbiddenException(
        'المدرس أو المساعد فقط يقدر يحدد الإجابة المقبولة.',
      );
    }

    const reply = await this.repliesRepository.findOne({
      where: { id: replyId, threadId, deletedAt: IsNull() },
    });
    if (!reply) {
      throw new NotFoundException('Reply not found.');
    }

    reply.isAccepted = true;
    await this.repliesRepository.save(reply);

    thread.acceptedReplyId = reply.id;
    await this.threadsRepository.save(thread);

    if (reply.authorId !== user.id) {
      this.notifications
        .notify({
          userId: reply.authorId,
          type: 'discussion_accepted',
          title: 'تم قبول إجابتك',
          message: `تم اعتماد ردك كإجابة مقبولة على: ${thread.title}`,
          relatedEntityType: 'discussion_thread',
          relatedEntityId: threadId,
        })
        .catch(() => {});
    }

    return this.getThread(threadId, user);
  }

  async unacceptAnswer(
    threadId: string,
    user: AuthenticatedUser,
    replyId?: string,
  ): Promise<DiscussionThreadDetailResponse> {
    const thread = await this.loadThreadOrThrow(threadId);
    const course = await this.assertCanAccessCourse(user, thread.courseId);

    if (!this.isEffectiveTeacher(user, course)) {
      throw new ForbiddenException(
        'المدرس أو المساعد فقط يقدر يلغي الإجابة المقبولة.',
      );
    }

    if (replyId) {
      const reply = await this.repliesRepository.findOne({
        where: { id: replyId, threadId, deletedAt: IsNull() },
      });
      if (reply) {
        reply.isAccepted = false;
        await this.repliesRepository.save(reply);
      }
    } else {
      await this.repliesRepository.update(
        { threadId, isAccepted: true },
        { isAccepted: false },
      );
    }

    const remainingAccepted = await this.repliesRepository.findOne({
      where: { threadId, isAccepted: true, deletedAt: IsNull() },
    });
    thread.acceptedReplyId = remainingAccepted ? remainingAccepted.id : null;
    await this.threadsRepository.save(thread);

    return this.getThread(threadId, user);
  }

  async toggleHelpful(
    threadId: string,
    user: AuthenticatedUser,
  ): Promise<{ isHelpfulByMe: boolean; helpfulCount: number }> {
    const thread = await this.loadThreadOrThrow(threadId);
    await this.assertCanAccessCourse(user, thread.courseId);

    const existing = await this.helpfulVotesRepository.findOne({
      where: { threadId, userId: user.id },
    });

    if (existing) {
      await this.helpfulVotesRepository.delete({ threadId, userId: user.id });
      await this.threadsRepository.decrement(
        { id: threadId },
        'helpfulCount',
        1,
      );
      return {
        isHelpfulByMe: false,
        helpfulCount: Math.max(0, thread.helpfulCount - 1),
      };
    }

    await this.helpfulVotesRepository.save(
      this.helpfulVotesRepository.create({ threadId, userId: user.id }),
    );
    await this.threadsRepository.increment({ id: threadId }, 'helpfulCount', 1);
    return { isHelpfulByMe: true, helpfulCount: thread.helpfulCount + 1 };
  }

  async togglePin(
    threadId: string,
    user: AuthenticatedUser,
  ): Promise<DiscussionThreadDetailResponse> {
    const thread = await this.loadThreadOrThrow(threadId);
    const course = await this.assertCanAccessCourse(user, thread.courseId);

    if (!this.isEffectiveTeacher(user, course)) {
      throw new ForbiddenException('المدرس فقط يقدر يثبت مناقشة.');
    }

    thread.isPinned = !thread.isPinned;
    await this.threadsRepository.save(thread);

    return this.getThread(threadId, user);
  }

  /**
   * Bulk, trusted-caller variant of listThreads — no per-course access
   * check, since callers (StudentService's community summary) already
   * derived `courseIds` from the student's own verified enrollments.
   * Returns only the single newest thread per course, for a "دوراتك"
   * list preview line — not a substitute for listThreads' full filtering.
   */
  async getLatestThreadsByCourseIds(
    courseIds: string[],
  ): Promise<Map<string, LatestThreadByCourse>> {
    if (courseIds.length === 0) return new Map();

    const threads = await this.threadsRepository
      .createQueryBuilder('t')
      .distinctOn(['t.courseId'])
      .where('t.courseId IN (:...courseIds)', { courseIds })
      .andWhere('t.deletedAt IS NULL')
      .orderBy('t.courseId', 'ASC')
      .addOrderBy('t.createdAt', 'DESC')
      .getMany();

    const authors = await this.loadAuthors(threads.map((t) => t.authorId));

    const result = new Map<string, LatestThreadByCourse>();
    for (const thread of threads) {
      result.set(thread.courseId, {
        authorName: authors.get(thread.authorId)?.fullName ?? 'مستخدم محذوف',
        title: thread.title,
        createdAt: thread.createdAt,
      });
    }
    return result;
  }

  /**
   * Resolves discussion-notification `relatedEntityId`s (thread ids) back
   * to their courseId — notifications carry no course FK (see
   * NotificationEntity's docblock), so this is how StudentService groups
   * unread discussion notifications by course.
   */
  async getCourseIdsForThreadIds(
    threadIds: string[],
  ): Promise<Map<string, string>> {
    if (threadIds.length === 0) return new Map();
    const threads = await this.threadsRepository.find({
      where: { id: In(threadIds) },
      select: { id: true, courseId: true },
    });
    return new Map(threads.map((t) => [t.id, t.courseId]));
  }

  // ---------------------------------------------------------------------

  private async loadThreadOrThrow(
    threadId: string,
  ): Promise<DiscussionThreadEntity> {
    const thread = await this.threadsRepository.findOne({
      where: { id: threadId, deletedAt: IsNull() },
    });
    if (!thread) {
      throw new NotFoundException('Discussion not found.');
    }
    return thread;
  }

  private isEffectiveTeacher(
    user: AuthenticatedUser,
    course: CourseEntity,
  ): boolean {
    if (user.role !== 'teacher' && user.role !== 'assistant') {
      return false;
    }
    const effectiveTeacherId =
      user.role === 'assistant' ? user.managedByTeacherId : user.id;
    return course.teacherId === effectiveTeacherId;
  }

  /**
   * Every discussion read/write re-derives access from the course itself —
   * a student must be actively enrolled, a teacher/assistant must own the
   * course. Never trusts the frontend's notion of "current course".
   */
  private async assertCanAccessCourse(
    user: AuthenticatedUser,
    courseId: string,
  ): Promise<CourseEntity> {
    const course = await this.coursesRepository.findOne({
      where: { id: courseId },
    });
    if (!course) {
      throw new NotFoundException('Course not found.');
    }

    if (user.role === 'student') {
      await this.enrollmentsService.assertStudentEnrolled(user.id, courseId);
      return course;
    }

    if (this.isEffectiveTeacher(user, course)) {
      return course;
    }

    throw new ForbiddenException(
      'You do not have permission to view this course community.',
    );
  }

  private normalizeTags(rawTags: string[]): string[] {
    const seen = new Set<string>();
    const normalized: string[] = [];
    for (const raw of rawTags) {
      const tag = raw.trim().replace(/^#/, '');
      if (!tag || tag.length > MAX_TAG_LENGTH) continue;
      const key = tag.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      normalized.push(tag);
      if (normalized.length >= MAX_TAGS) break;
    }
    return normalized;
  }

  private async loadAuthors(ids: string[]): Promise<Map<string, UserEntity>> {
    const uniqueIds = Array.from(new Set(ids));
    if (uniqueIds.length === 0) return new Map();
    const users = await this.usersRepository.find({
      where: { id: In(uniqueIds) },
      select: { id: true, fullName: true, avatarUrl: true },
    });
    return new Map(users.map((u) => [u.id, u]));
  }

  private async loadHelpfulThreadIds(
    userId: string,
    threadIds: string[],
  ): Promise<Set<string>> {
    if (threadIds.length === 0) return new Set();
    const votes = await this.helpfulVotesRepository.find({
      where: { userId, threadId: In(threadIds) },
    });
    return new Set(votes.map((v) => v.threadId));
  }

  private resolveAuthor(
    authorId: string,
    authorRole: UserRole,
    authors: Map<string, UserEntity>,
  ): DiscussionAuthorSummary {
    const user = authors.get(authorId);
    return {
      id: authorId,
      fullName: user?.fullName ?? 'مستخدم محذوف',
      avatarUrl: user?.avatarUrl ?? null,
      role: authorRole,
    };
  }

  private toListItem(
    thread: DiscussionThreadEntity,
    authors: Map<string, UserEntity>,
    helpfulThreadIds: Set<string>,
    unreadThreadIds?: Set<string>,
  ): DiscussionThreadListItemResponse {
    return {
      id: thread.id,
      courseId: thread.courseId,
      title: thread.title,
      body: thread.body,
      author: this.resolveAuthor(thread.authorId, thread.authorRole, authors),
      tags: thread.tags,
      replyCount: thread.replyCount,
      helpfulCount: thread.helpfulCount,
      isHelpfulByMe: helpfulThreadIds.has(thread.id),
      isPinned: thread.isPinned,
      isAnswered: thread.acceptedReplyId !== null,
      createdAt: thread.createdAt.toISOString(),
      hasUnread: unreadThreadIds?.has(thread.id) ?? false,
    };
  }
}
