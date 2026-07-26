import type { CourseStatus } from '../entities/course.entity';

export interface CourseLessonResponseDto {
  id: string;
  title: string;
  videoUrl: string | null;
  sortOrder: number;
}

export interface CourseSectionResponseDto {
  id: string;
  title: string;
  sortOrder: number;
  lessons: CourseLessonResponseDto[];
}

/**
 * Shared student/teacher course-detail response. Deliberately not
 * wrapped in a `data` envelope — see docs/api-conventions.md's "Response
 * envelope" open item: nothing else shipped in Sprint 1 uses one.
 */
export class CourseDetailResponseDto {
  id!: string;
  title!: string;
  slug!: string;
  description!: string | null;
  coverImageUrl!: string | null;
  gradeLevel!: string | null;
  status!: CourseStatus;
  teacher!: { id: string; fullName: string };
  canEdit!: boolean;
  sections!: CourseSectionResponseDto[];
}
