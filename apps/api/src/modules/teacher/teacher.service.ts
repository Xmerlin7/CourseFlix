import { BadRequestException, Injectable } from '@nestjs/common';
import { CoursesService } from '../courses/courses.service';
import { CourseEntity, CourseStatus } from '../courses/entities/course.entity';
import type { SectionEntity } from '../courses/entities/section.entity';
import type { LessonEntity } from '../courses/entities/lesson.entity';
import { EnrollmentsService } from '../enrollments/enrollments.service';
import { UpdateCourseDto } from './dto/update-course.dto';
import { CreateCourseDto } from '../courses/dto/create-course.dto';
import { CreateSectionDto } from '../courses/dto/create-section.dto';
import { UpdateSectionDto } from '../courses/dto/update-section.dto';
import { CreateLessonDto } from '../courses/dto/create-lesson.dto';
import { UpdateLessonDto } from '../courses/dto/update-lesson.dto';
import { ReorderDto } from '../courses/dto/reorder.dto';

export interface TeacherCourseListItem {
  id: string;
  title: string;
  description: string | null;
  coverImageUrl: string | null;
  gradeLevel: string | null;
  status: CourseStatus;
}

export interface TeacherDashboardResponse {
  teacher: { id: string };
  stats: {
    ownedCourseCount: number;
    publishedCourseCount: number;
    enrolledStudentCount: number;
  };
  recentCourses: Array<{ id: string; title: string; status: CourseStatus }>;
}

const VALID_COURSE_STATUSES: readonly CourseStatus[] = [
  'draft',
  'published',
  'archived',
];

function parseCourseStatus(value?: string): CourseStatus | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (!VALID_COURSE_STATUSES.includes(value as CourseStatus)) {
    throw new BadRequestException(
      `Invalid status filter: "${value}". Must be one of ${VALID_COURSE_STATUSES.join(', ')}.`,
    );
  }

  return value as CourseStatus;
}

@Injectable()
export class TeacherService {
  constructor(
    private readonly coursesService: CoursesService,
    private readonly enrollmentsService: EnrollmentsService,
  ) {}

  async getDashboard(teacherId: string): Promise<TeacherDashboardResponse> {
    const courses = await this.coursesService.findOwnedCourses(teacherId);
    const enrolledStudentCount =
      await this.enrollmentsService.countActiveStudentsByCourseIds(
        courses.map((course) => course.id),
      );

    return {
      teacher: { id: teacherId },
      stats: {
        ownedCourseCount: courses.length,
        publishedCourseCount: courses.filter(
          (course) => course.status === 'published',
        ).length,
        enrolledStudentCount,
      },
      recentCourses: courses.slice(0, 5).map((course) => ({
        id: course.id,
        title: course.title,
        status: course.status,
      })),
    };
  }

  async getCourses(
    teacherId: string,
    status?: string,
  ): Promise<TeacherCourseListItem[]> {
    const courses = await this.coursesService.findOwnedCourses(
      teacherId,
      parseCourseStatus(status),
    );
    return courses.map((course) => this.toListItem(course));
  }

  async updateCourse(
    courseId: string,
    teacherId: string,
    updateCourseDto: UpdateCourseDto,
  ): Promise<TeacherCourseListItem> {
    const course = await this.coursesService.updateCourseMetadata(
      courseId,
      teacherId,
      updateCourseDto,
    );
    return this.toListItem(course);
  }

  async createCourse(
    teacherId: string,
    dto: CreateCourseDto,
  ): Promise<TeacherCourseListItem> {
    const course = await this.coursesService.createCourse(teacherId, dto);
    return this.toListItem(course);
  }

  async deleteCourse(courseId: string, teacherId: string): Promise<void> {
    await this.coursesService.deleteCourse(courseId, teacherId);
  }

  async createSection(
    courseId: string,
    teacherId: string,
    dto: CreateSectionDto,
  ): Promise<SectionEntity> {
    return this.coursesService.createSection(courseId, teacherId, dto.title);
  }

  async getSection(
    sectionId: string,
    teacherId: string,
  ): Promise<SectionEntity> {
    return this.coursesService.getSection(sectionId, teacherId);
  }

  async updateSection(
    sectionId: string,
    teacherId: string,
    dto: UpdateSectionDto,
  ): Promise<SectionEntity> {
    return this.coursesService.updateSection(sectionId, teacherId, dto);
  }

  async deleteSection(sectionId: string, teacherId: string): Promise<void> {
    await this.coursesService.deleteSection(sectionId, teacherId);
  }

  async reorderSections(
    courseId: string,
    teacherId: string,
    dto: ReorderDto,
  ): Promise<void> {
    await this.coursesService.reorderSections(courseId, teacherId, dto.items);
  }

  async createLesson(
    sectionId: string,
    teacherId: string,
    dto: CreateLessonDto,
  ): Promise<LessonEntity> {
    return this.coursesService.createLesson(sectionId, teacherId, dto);
  }

  async getLesson(lessonId: string, teacherId: string): Promise<LessonEntity> {
    return this.coursesService.getLesson(lessonId, teacherId);
  }

  async updateLesson(
    lessonId: string,
    teacherId: string,
    dto: UpdateLessonDto,
  ): Promise<LessonEntity> {
    return this.coursesService.updateLesson(lessonId, teacherId, dto);
  }

  async deleteLesson(lessonId: string, teacherId: string): Promise<void> {
    await this.coursesService.deleteLesson(lessonId, teacherId);
  }

  async reorderLessons(
    sectionId: string,
    teacherId: string,
    dto: ReorderDto,
  ): Promise<void> {
    await this.coursesService.reorderLessons(sectionId, teacherId, dto.items);
  }

  private toListItem(course: CourseEntity): TeacherCourseListItem {
    return {
      id: course.id,
      title: course.title,
      description: course.description,
      coverImageUrl: course.coverImageUrl,
      gradeLevel: course.gradeLevel,
      status: course.status,
    };
  }
}
