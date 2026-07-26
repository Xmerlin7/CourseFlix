import { BadRequestException, Injectable } from '@nestjs/common';
import { CoursesService } from '../courses/courses.service';
import { CourseEntity, CourseStatus } from '../courses/entities/course.entity';
import { EnrollmentsService } from '../enrollments/enrollments.service';
import { UpdateCourseDto } from './dto/update-course.dto';

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
