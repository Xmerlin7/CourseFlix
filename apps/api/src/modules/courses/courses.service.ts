import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Repository } from 'typeorm';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { EnrollmentsService } from '../enrollments/enrollments.service';
import { CourseDetailResponseDto } from './dto/course-detail-response.dto';
import { CourseEntity, CourseStatus } from './entities/course.entity';

export interface UpdateCourseFields {
  title?: string;
  description?: string | null;
  coverImageUrl?: string | null;
  gradeLevel?: string | null;
  status?: 'draft' | 'published';
}

@Injectable()
export class CoursesService {
  constructor(
    @InjectRepository(CourseEntity)
    private readonly coursesRepository: Repository<CourseEntity>,
    private readonly enrollmentsService: EnrollmentsService,
  ) {}

  /**
   * Shared course-detail read: enrolled student or owning teacher only.
   * Used directly by CoursesController and reused as-is by the teacher
   * course-management page (Nabile) — see sprint1-plan.md's "Build
   * reusable course-detail components that Nabile can reuse".
   */
  async getCourseDetail(
    courseId: string,
    viewer: AuthenticatedUser,
  ): Promise<CourseDetailResponseDto> {
    const course = await this.loadCourseWithSectionsAndLessons(courseId);
    if (!course) {
      throw new NotFoundException('Course not found.');
    }

    const canEdit = course.teacherId === viewer.id;

    if (viewer.role === 'teacher') {
      if (!canEdit) {
        throw new ForbiddenException('You do not own this course.');
      }
    } else {
      await this.enrollmentsService.assertStudentEnrolled(viewer.id, courseId);
    }

    return this.toDetailDto(course, canEdit);
  }

  /**
   * Courses owned by this teacher only, optionally filtered by status.
   */
  async findOwnedCourses(
    teacherId: string,
    status?: CourseStatus,
  ): Promise<CourseEntity[]> {
    const query = this.coursesRepository
      .createQueryBuilder('course')
      .where('course.teacher_id = :teacherId', { teacherId })
      .andWhere('course.deleted_at IS NULL');

    if (status) {
      query.andWhere('course.status = :status', { status });
    }

    return query.orderBy('course.created_at', 'DESC').getMany();
  }

  /**
   * Patches allowed course metadata after verifying teacher ownership.
   * `fields` must already be whitelisted/validated by the caller's DTO
   * (see UpdateCourseDto) — this method trusts its input shape.
   */
  async updateCourseMetadata(
    courseId: string,
    teacherId: string,
    fields: UpdateCourseFields,
  ): Promise<CourseEntity> {
    const course = await this.coursesRepository.findOne({
      where: { id: courseId, deletedAt: IsNull() },
    });

    if (!course) {
      throw new NotFoundException('Course not found.');
    }

    if (course.teacherId !== teacherId) {
      throw new ForbiddenException('You do not own this course.');
    }

    Object.assign(course, fields);
    return this.coursesRepository.save(course);
  }

  /**
   * Bulk lookup for other modules that need to enrich their own data with
   * course title/gradeLevel without duplicating course access logic —
   * e.g. the student dashboard/enrollments list (Habsa). No permission
   * check here: callers only ever use this to enrich data the viewer is
   * already independently authorized to see (their own enrollments).
   */
  async findByIds(courseIds: string[]): Promise<CourseEntity[]> {
    if (courseIds.length === 0) {
      return [];
    }

    return this.coursesRepository.find({
      where: { id: In(courseIds), deletedAt: IsNull() },
    });
  }

  private async loadCourseWithSectionsAndLessons(
    courseId: string,
  ): Promise<CourseEntity | null> {
    return this.coursesRepository
      .createQueryBuilder('course')
      .leftJoinAndSelect('course.teacher', 'teacher')
      .leftJoinAndSelect(
        'course.sections',
        'section',
        'section.deleted_at IS NULL',
      )
      .leftJoinAndSelect(
        'section.lessons',
        'lesson',
        'lesson.deleted_at IS NULL',
      )
      .where('course.id = :courseId', { courseId })
      .andWhere('course.deleted_at IS NULL')
      .orderBy('section.order_index', 'ASC')
      .addOrderBy('lesson.order_index', 'ASC')
      .getOne();
  }

  private toDetailDto(
    course: CourseEntity,
    canEdit: boolean,
  ): CourseDetailResponseDto {
    return {
      id: course.id,
      title: course.title,
      slug: course.slug,
      description: course.description,
      coverImageUrl: course.coverImageUrl,
      gradeLevel: course.gradeLevel,
      status: course.status,
      teacher: {
        id: course.teacher!.id,
        fullName: course.teacher!.fullName,
      },
      canEdit,
      sections: (course.sections ?? []).map((section) => ({
        id: section.id,
        title: section.title,
        sortOrder: section.sortOrder,
        lessons: (section.lessons ?? []).map((lesson) => ({
          id: lesson.id,
          title: lesson.title,
          videoUrl: lesson.videoUrl,
          sortOrder: lesson.sortOrder,
        })),
      })),
    };
  }
}
