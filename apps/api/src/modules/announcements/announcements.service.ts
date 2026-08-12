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
import { EnrollmentEntity } from '../enrollments/entities/enrollment.entity';
import { EnrollmentsService } from '../enrollments/enrollments.service';
import { PostAttachmentEntity } from './entities/post-attachment.entity';
import { PostEntity } from './entities/post.entity';

const MAX_CONTENT_LENGTH = 5_000;

export interface AnnouncementAttachmentResponse {
  id: string;
  fileName: string;
  mimeType: string;
}

export interface AnnouncementResponse {
  id: string;
  content: string;
  isPinned: boolean;
  attachments: AnnouncementAttachmentResponse[];
  canManage: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAnnouncementInput {
  content: string;
  attachment?: {
    buffer: Buffer;
    originalName: string;
    mimeType: string;
    sizeBytes: number;
  };
}

@Injectable()
export class AnnouncementsService {
  constructor(
    @InjectRepository(PostEntity)
    private readonly postsRepository: Repository<PostEntity>,
    @InjectRepository(PostAttachmentEntity)
    private readonly attachmentsJoinRepository: Repository<PostAttachmentEntity>,
    @InjectRepository(FileEntity)
    private readonly filesRepository: Repository<FileEntity>,
    @InjectRepository(CourseEntity)
    private readonly coursesRepository: Repository<CourseEntity>,
    @InjectRepository(EnrollmentEntity)
    private readonly enrollmentsRepository: Repository<EnrollmentEntity>,
    private readonly enrollmentsService: EnrollmentsService,
    private readonly attachmentsService: AttachmentsService,
    @Inject(NOTIFICATION_PRODUCER_PORT)
    private readonly notifications: NotificationProducerPort,
  ) {}

  async listAnnouncements(
    courseId: string,
    user: AuthenticatedUser,
  ): Promise<AnnouncementResponse[]> {
    const course = await this.assertCanAccessCourse(user, courseId);
    const isManager = this.isEffectiveTeacher(user, course);

    const posts = await this.postsRepository.find({
      where: { courseId, deletedAt: IsNull() },
      order: { pinnedAt: 'DESC', createdAt: 'DESC' },
      take: 100,
    });

    return this.toResponses(posts, isManager);
  }

  async createAnnouncement(
    courseId: string,
    user: AuthenticatedUser,
    input: CreateAnnouncementInput,
  ): Promise<AnnouncementResponse> {
    const course = await this.assertCanAccessCourse(user, courseId);
    if (!this.isEffectiveTeacher(user, course)) {
      throw new ForbiddenException('Only the teacher can post announcements.');
    }

    const content = input.content.trim();
    if (!content) {
      throw new BadRequestException('نص الإعلان مطلوب.');
    }
    if (content.length > MAX_CONTENT_LENGTH) {
      throw new BadRequestException('نص الإعلان طويل جدًا.');
    }

    const post = await this.postsRepository.save(
      this.postsRepository.create({
        courseId,
        teacherId: course.teacherId,
        content,
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
          postId: post.id,
          fileId: file.id,
          orderIndex: 0,
        }),
      );
    }

    await this.notifyEnrolledStudents(courseId, post.id, content);

    return (await this.toResponses([post], true))[0];
  }

  async updateAnnouncement(
    postId: string,
    user: AuthenticatedUser,
    content: string,
  ): Promise<AnnouncementResponse> {
    const post = await this.loadPostOrThrow(postId);
    const course = await this.assertCanAccessCourse(user, post.courseId);
    if (!this.isEffectiveTeacher(user, course)) {
      throw new ForbiddenException('Only the teacher can edit announcements.');
    }

    const trimmed = content.trim();
    if (!trimmed) {
      throw new BadRequestException('نص الإعلان مطلوب.');
    }
    if (trimmed.length > MAX_CONTENT_LENGTH) {
      throw new BadRequestException('نص الإعلان طويل جدًا.');
    }

    post.content = trimmed;
    await this.postsRepository.save(post);

    return (await this.toResponses([post], true))[0];
  }

  async deleteAnnouncement(
    postId: string,
    user: AuthenticatedUser,
  ): Promise<void> {
    const post = await this.loadPostOrThrow(postId);
    const course = await this.assertCanAccessCourse(user, post.courseId);
    if (!this.isEffectiveTeacher(user, course)) {
      throw new ForbiddenException('Only the teacher can delete announcements.');
    }

    await this.postsRepository.softDelete(post.id);
  }

  async togglePin(
    postId: string,
    user: AuthenticatedUser,
  ): Promise<AnnouncementResponse> {
    const post = await this.loadPostOrThrow(postId);
    const course = await this.assertCanAccessCourse(user, post.courseId);
    if (!this.isEffectiveTeacher(user, course)) {
      throw new ForbiddenException('Only the teacher can pin announcements.');
    }

    post.pinnedAt = post.pinnedAt ? null : new Date();
    await this.postsRepository.save(post);

    return (await this.toResponses([post], true))[0];
  }

  // ---------------------------------------------------------------------

  private async loadPostOrThrow(postId: string): Promise<PostEntity> {
    const post = await this.postsRepository.findOne({
      where: { id: postId, deletedAt: IsNull() },
    });
    if (!post) {
      throw new NotFoundException('Announcement not found.');
    }
    return post;
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
      'You do not have permission to view this course.',
    );
  }

  private async notifyEnrolledStudents(
    courseId: string,
    postId: string,
    content: string,
  ): Promise<void> {
    const enrollments = await this.enrollmentsRepository.find({
      where: { courseId, status: 'active', deletedAt: IsNull() },
      select: { studentId: true },
    });

    const preview =
      content.length > 120 ? `${content.slice(0, 120)}…` : content;

    await Promise.allSettled(
      enrollments.map((enrollment) =>
        this.notifications.notify({
          userId: enrollment.studentId,
          type: 'announcement',
          title: 'إعلان جديد من المدرس',
          message: preview,
          relatedEntityType: 'post',
          relatedEntityId: postId,
        }),
      ),
    );
  }

  private async toResponses(
    posts: PostEntity[],
    canManage: boolean,
  ): Promise<AnnouncementResponse[]> {
    if (posts.length === 0) return [];

    const attachmentRows = await this.attachmentsJoinRepository.find({
      where: { postId: In(posts.map((p) => p.id)) },
    });
    const files = attachmentRows.length
      ? await this.filesRepository.find({
          where: { id: In(attachmentRows.map((a) => a.fileId)) },
        })
      : [];
    const filesByPostId = new Map<string, FileEntity[]>();
    for (const row of attachmentRows) {
      const file = files.find((f) => f.id === row.fileId);
      if (!file) continue;
      const list = filesByPostId.get(row.postId) ?? [];
      list.push(file);
      filesByPostId.set(row.postId, list);
    }

    return posts.map((post) => ({
      id: post.id,
      content: post.content,
      isPinned: post.pinnedAt !== null,
      attachments: (filesByPostId.get(post.id) ?? []).map((f) => ({
        id: f.id,
        fileName: f.fileName,
        mimeType: f.mimeType,
      })),
      canManage,
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString(),
    }));
  }
}
