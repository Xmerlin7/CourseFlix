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
import type { AuthenticatedUser, UserRole } from '../auth/interfaces/authenticated-user.interface';
import { CourseEntity } from '../courses/entities/course.entity';
import { EnrollmentsService } from '../enrollments/enrollments.service';
import { UserEntity } from '../users/entities/user.entity';
import { AttachmentsService } from '../attachments/attachments.service';
import { FileEntity } from '../documents/entities/file.entity';
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
  author: DiscussionAuthorSummary;
  tags: string[];
  replyCount: number;
  helpfulCount: number;
  isHelpfulByMe: boolean;
  isPinned: boolean;
  isAnswered: boolean;
  createdAt: string;
}

export interface DiscussionReplyResponse {
  id: string;
  author: DiscussionAuthorSummary;
  body: string;
  isAccepted: boolean;
  createdAt: string;
}

export interface DiscussionThreadDetailResponse
  extends DiscussionThreadListItemResponse {
  body: string;
  attachments: DiscussionAttachmentResponse[];
  replies: DiscussionReplyResponse[];
  canAccept: boolean;
  canPin: boolean;
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

    qb.orderBy('t.isPinned', 'DESC').addOrderBy('t.createdAt', 'DESC').take(100);

    const threads = await qb.getMany();
    const authors = await this.loadAuthors(threads.map((t) => t.authorId));
    const helpfulThreadIds = await this.loadHelpfulThreadIds(
      user.id,
      threads.map((t) => t.id),
    );

    return threads.map((t) => this.toListItem(t, authors, helpfulThreadIds));
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
        isAccepted: thread.acceptedReplyId === r.id,
        createdAt: r.createdAt.toISOString(),
      })),
      canAccept: thread.authorId === user.id,
      canPin: isTeacherOfCourse,
    };
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

    const title = input.title.trim();
    const body = input.body.trim();
    if (!title) throw new BadRequestException('عنوان السؤال مطلوب.');
    if (!body) throw new BadRequestException('تفاصيل السؤال مطلوبة.');
    if (title.length > MAX_TITLE_LENGTH) {
      throw new BadRequestException('عنوان السؤال طويل جدًا.');
    }
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

    this.notifications
      .notify({
        userId: course.teacherId,
        type: 'discussion_reply',
        title: 'سؤال جديد في المجتمع',
        message: `${user.fullName} سأل: ${title}`,
        relatedEntityType: 'discussion_thread',
        relatedEntityId: thread.id,
      })
      .catch(() => {
        // Best-effort — a missed notification never blocks the question itself.
      });

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
      }),
    );

    await this.threadsRepository.increment({ id: threadId }, 'replyCount', 1);

    if (thread.authorId !== user.id) {
      this.notifications
        .notify({
          userId: thread.authorId,
          type: 'discussion_reply',
          title: 'رد جديد على سؤالك',
          message: `${user.fullName} رد على سؤالك: ${thread.title}`,
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
    await this.assertCanAccessCourse(user, thread.courseId);

    if (thread.authorId !== user.id) {
      throw new ForbiddenException(
        'صاحب السؤال فقط يقدر يحدد الإجابة المقبولة.',
      );
    }

    const reply = await this.repliesRepository.findOne({
      where: { id: replyId, threadId, deletedAt: IsNull() },
    });
    if (!reply) {
      throw new NotFoundException('Reply not found.');
    }

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
  ): Promise<DiscussionThreadDetailResponse> {
    const thread = await this.loadThreadOrThrow(threadId);
    await this.assertCanAccessCourse(user, thread.courseId);

    if (thread.authorId !== user.id) {
      throw new ForbiddenException(
        'صاحب السؤال فقط يقدر يلغي الإجابة المقبولة.',
      );
    }

    thread.acceptedReplyId = null;
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
      await this.threadsRepository.decrement({ id: threadId }, 'helpfulCount', 1);
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

  private async loadAuthors(
    ids: string[],
  ): Promise<Map<string, UserEntity>> {
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
  ): DiscussionThreadListItemResponse {
    return {
      id: thread.id,
      courseId: thread.courseId,
      title: thread.title,
      author: this.resolveAuthor(thread.authorId, thread.authorRole, authors),
      tags: thread.tags,
      replyCount: thread.replyCount,
      helpfulCount: thread.helpfulCount,
      isHelpfulByMe: helpfulThreadIds.has(thread.id),
      isPinned: thread.isPinned,
      isAnswered: thread.acceptedReplyId !== null,
      createdAt: thread.createdAt.toISOString(),
    };
  }
}
