import type { CourseStatus } from '../entities/course.entity';
import type { LessonStatus } from '../entities/lesson.entity';
import type { VideoModerationStatus } from '../../lessons/entities/video.entity';
import type { SectionStatus } from '../entities/section.entity';

export interface CourseLessonResponseDto {
  id: string;
  title: string;
  videoUrl: string | null;
  sortOrder: number;
  status: LessonStatus;
  /**
   * Review state of the lesson's video, or null when the lesson has no
   * video row at all. `status` above is only the teacher's own
   * publish/draft toggle — a "published" lesson whose video is still
   * `pending` or was `rejected` is invisible to students, so the two
   * have to be shown separately.
   */
  videoModerationStatus: VideoModerationStatus | null;
  /** Teacher/admin only — quotes the flagged content. */
  videoModerationReason: string | null;
}

export interface CourseSectionResponseDto {
  id: string;
  title: string;
  sortOrder: number;
  status: SectionStatus;
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
  /** `null` = platform default price. In EGP minor units (1/100 EGP). */
  priceMinor!: number | null;
  teacher!: { id: string; fullName: string };
  canEdit!: boolean;
  sections!: CourseSectionResponseDto[];
}
