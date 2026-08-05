/**
 * Lightweight browsable-catalog shape — deliberately excludes sections/
 * lessons (and therefore `videoUrl`): `GET /courses` is reachable by any
 * authenticated student, enrolled or not, so it must never expose actual
 * lesson content, only what a course listing/marketing card needs.
 */
export class CourseCatalogItemDto {
  id!: string;
  title!: string;
  description!: string | null;
  coverImageUrl!: string | null;
  gradeLevel!: string | null;
  teacherName!: string;
  priceMinor!: number;
  currency!: string;
  isEnrolled!: boolean;
}
