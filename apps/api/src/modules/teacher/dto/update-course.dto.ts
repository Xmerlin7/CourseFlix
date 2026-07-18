export class UpdateCourseDto {
  // TODO: add class-validator decorators for allowed teacher-editable fields.
  title?: string;
  description?: string;
  gradeLevel?: string;
  status?: 'draft' | 'active' | 'archived';
}
