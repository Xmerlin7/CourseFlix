export class EnrollmentEntity {
  // TODO: add unique student-course constraint in the migration.
  id!: string;
  studentId!: string;
  courseId!: string;
  status!: 'active' | 'completed' | 'cancelled';
  enrolledAt!: Date;
}
