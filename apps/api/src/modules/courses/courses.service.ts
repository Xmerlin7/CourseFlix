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
import { SectionEntity, SectionStatus } from './entities/section.entity';
import { LessonEntity, LessonStatus } from './entities/lesson.entity';

export interface UpdateCourseFields {
  title?: string;
  description?: string | null;
  coverImageUrl?: string | null;
  gradeLevel?: string | null;
  status?: 'draft' | 'published';
}

function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 200);
}

@Injectable()
export class CoursesService {
  constructor(
    @InjectRepository(CourseEntity)
    private readonly coursesRepository: Repository<CourseEntity>,
    @InjectRepository(SectionEntity)
    private readonly sectionsRepository: Repository<SectionEntity>,
    @InjectRepository(LessonEntity)
    private readonly lessonsRepository: Repository<LessonEntity>,
    private readonly enrollmentsService: EnrollmentsService,
  ) {}

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

  async findByIds(courseIds: string[]): Promise<CourseEntity[]> {
    if (courseIds.length === 0) {
      return [];
    }

    return this.coursesRepository.find({
      where: { id: In(courseIds), deletedAt: IsNull() },
    });
  }

  async findCourseById(courseId: string): Promise<CourseEntity | null> {
    return this.coursesRepository.findOne({
      where: { id: courseId, deletedAt: IsNull() },
    });
  }

  async createCourse(
    teacherId: string,
    fields: {
      title: string;
      description?: string | null;
      coverImageUrl?: string | null;
      gradeLevel?: string | null;
    },
  ): Promise<CourseEntity> {
    let slug = slugify(fields.title);
    const existing = await this.coursesRepository.findOne({
      where: { slug, deletedAt: IsNull() },
    });
    if (existing) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }

    const course = this.coursesRepository.create({
      teacherId,
      title: fields.title,
      slug,
      description: fields.description ?? null,
      coverImageUrl: fields.coverImageUrl ?? null,
      gradeLevel: fields.gradeLevel ?? null,
      status: 'draft',
    });
    return this.coursesRepository.save(course);
  }

  async deleteCourse(courseId: string, teacherId: string): Promise<void> {
    const course = await this.coursesRepository.findOne({
      where: { id: courseId, deletedAt: IsNull() },
    });
    if (!course) {
      throw new NotFoundException('Course not found.');
    }
    if (course.teacherId !== teacherId) {
      throw new ForbiddenException('You do not own this course.');
    }

    await this.coursesRepository.softRemove(course);
  }

  // ── Sections ──

  async createSection(
    courseId: string,
    teacherId: string,
    title: string,
  ): Promise<SectionEntity> {
    await this.assertTeacherOwnsCourse(courseId, teacherId);

    const row = await this.sectionsRepository
      .createQueryBuilder('section')
      .where('section.course_id = :courseId', { courseId })
      .andWhere('section.deleted_at IS NULL')
      .select('COALESCE(MAX(section.order_index), 0)', 'max')
      .getRawOne();
    const nextOrder = (Number(row?.max ?? 0) || 0) + 1;

    const section = this.sectionsRepository.create({
      courseId,
      title,
      sortOrder: nextOrder,
      status: 'published',
    });
    return this.sectionsRepository.save(section);
  }

  async getSection(
    sectionId: string,
    teacherId: string,
  ): Promise<SectionEntity> {
    const section = await this.sectionsRepository.findOne({
      where: { id: sectionId, deletedAt: IsNull() },
      relations: { course: true },
    });
    if (!section) {
      throw new NotFoundException('Section not found.');
    }
    if (section.course?.teacherId !== teacherId) {
      throw new ForbiddenException('You do not own this course.');
    }
    return section;
  }

  async updateSection(
    sectionId: string,
    teacherId: string,
    fields: { title?: string; status?: SectionStatus },
  ): Promise<SectionEntity> {
    const section = await this.getSection(sectionId, teacherId);
    Object.assign(section, fields);
    return this.sectionsRepository.save(section);
  }

  async deleteSection(sectionId: string, teacherId: string): Promise<void> {
    const section = await this.getSection(sectionId, teacherId);
    await this.sectionsRepository.softRemove(section);
  }

  async reorderSections(
    courseId: string,
    teacherId: string,
    items: Array<{ id: string; sortOrder: number }>,
  ): Promise<void> {
    await this.assertTeacherOwnsCourse(courseId, teacherId);

    for (const item of items) {
      await this.sectionsRepository.update(
        { id: item.id, courseId },
        { sortOrder: item.sortOrder },
      );
    }
  }

  // ── Lessons ──

  async createLesson(
    sectionId: string,
    teacherId: string,
    fields: { title: string; videoUrl?: string | null },
  ): Promise<LessonEntity> {
    const section = await this.getSection(sectionId, teacherId);

    const row = await this.lessonsRepository
      .createQueryBuilder('lesson')
      .where('lesson.section_id = :sectionId', { sectionId })
      .andWhere('lesson.deleted_at IS NULL')
      .select('COALESCE(MAX(lesson.order_index), 0)', 'max')
      .getRawOne();
    const nextOrder = (Number(row?.max ?? 0) || 0) + 1;

    const lesson = this.lessonsRepository.create({
      sectionId,
      courseId: section.courseId,
      title: fields.title,
      videoUrl: fields.videoUrl ?? null,
      sortOrder: nextOrder,
      status: section.status === 'draft' ? 'draft' : 'published',
    });
    return this.lessonsRepository.save(lesson);
  }

  async getLesson(lessonId: string, teacherId: string): Promise<LessonEntity> {
    const lesson = await this.lessonsRepository.findOne({
      where: { id: lessonId, deletedAt: IsNull() },
      relations: { section: { course: true } },
    });
    if (!lesson) {
      throw new NotFoundException('Lesson not found.');
    }
    if (lesson.section?.course?.teacherId !== teacherId) {
      throw new ForbiddenException('You do not own this course.');
    }
    return lesson;
  }

  async updateLesson(
    lessonId: string,
    teacherId: string,
    fields: { title?: string; videoUrl?: string | null; status?: LessonStatus },
  ): Promise<LessonEntity> {
    const lesson = await this.getLesson(lessonId, teacherId);
    Object.assign(lesson, fields);
    return this.lessonsRepository.save(lesson);
  }

  async deleteLesson(lessonId: string, teacherId: string): Promise<void> {
    const lesson = await this.getLesson(lessonId, teacherId);
    await this.lessonsRepository.softRemove(lesson);
  }

  async reorderLessons(
    sectionId: string,
    teacherId: string,
    items: Array<{ id: string; sortOrder: number }>,
  ): Promise<void> {
    await this.getSection(sectionId, teacherId);

    for (const item of items) {
      await this.lessonsRepository.update(
        { id: item.id, sectionId },
        { sortOrder: item.sortOrder },
      );
    }
  }

  // ── Private ──

  private async assertTeacherOwnsCourse(
    courseId: string,
    teacherId: string,
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
    return course;
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
