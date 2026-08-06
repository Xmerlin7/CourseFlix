import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, IsNull, Repository } from 'typeorm';
import { CourseEntity, CourseStatus } from '../../courses/entities/course.entity';
import { CoursesService, UpdateCourseFields } from '../../courses/courses.service';
import { CourseDetailResponseDto } from '../../courses/dto/course-detail-response.dto';
import { ListCoursesQueryDto } from '../dto/list-courses-query.dto';

export interface AdminCourseListItem {
  id: string;
  title: string;
  slug: string;
  gradeLevel: string | null;
  status: CourseStatus;
  teacherId: string;
  teacherName: string;
  createdAt: string;
}

// Same operational-list cap convention as AdminUsersService/AgentLogsService.
const MAX_RESULTS = 200;

@Injectable()
export class AdminCoursesService {
  constructor(
    @InjectRepository(CourseEntity)
    private readonly coursesRepository: Repository<CourseEntity>,
    private readonly coursesService: CoursesService,
  ) {}

  async listCourses(query: ListCoursesQueryDto): Promise<AdminCourseListItem[]> {
    const where: Record<string, unknown> = { deletedAt: IsNull() };
    if (query.status) where.status = query.status;
    if (query.teacherId) where.teacherId = query.teacherId;
    if (query.search) where.title = ILike(`%${query.search}%`);

    const courses = await this.coursesRepository.find({
      where,
      relations: { teacher: true },
      order: { createdAt: 'DESC' },
      take: MAX_RESULTS,
    });

    return courses.map((course) => ({
      id: course.id,
      title: course.title,
      slug: course.slug,
      gradeLevel: course.gradeLevel,
      status: course.status,
      teacherId: course.teacherId,
      teacherName: course.teacher?.fullName ?? '—',
      createdAt: course.createdAt.toISOString(),
    }));
  }

  getCourseDetail(courseId: string): Promise<CourseDetailResponseDto> {
    return this.coursesService.getCourseDetailForAdmin(courseId);
  }

  async updateCourse(
    courseId: string,
    fields: UpdateCourseFields,
  ): Promise<CourseDetailResponseDto> {
    const teacherId = await this.resolveTeacherId(courseId);
    await this.coursesService.updateCourseMetadata(courseId, teacherId, fields);
    return this.getCourseDetail(courseId);
  }

  // Soft delete only — CoursesService.deleteCourse() already uses
  // softRemove() under the hood, so this is reversible and carries no
  // FK-violation risk the way a real DELETE against enrollments/orders
  // referencing this course would.
  async deleteCourse(courseId: string): Promise<void> {
    const teacherId = await this.resolveTeacherId(courseId);
    await this.coursesService.deleteCourse(courseId, teacherId);
  }

  private async resolveTeacherId(courseId: string): Promise<string> {
    const course = await this.coursesService.findCourseById(courseId);
    if (!course) {
      throw new NotFoundException('Course not found.');
    }
    return course.teacherId;
  }
}
