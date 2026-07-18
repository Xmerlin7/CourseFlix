export class CourseDetailResponseDto {
  // TODO: shape the shared student/teacher course-detail response contract.
  id!: string;
  title!: string;
  description!: string;
  canEdit!: boolean;
  sections!: unknown[];
}
