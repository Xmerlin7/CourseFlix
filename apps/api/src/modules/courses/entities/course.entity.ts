export class CourseEntity {
  // TODO: convert to TypeORM entity with teacher owner relation.
  id!: string;
  teacherId!: string;
  title!: string;
  description!: string;
  gradeLevel!: string;
  status!: 'draft' | 'active' | 'archived';
  createdAt!: Date;
  updatedAt!: Date;
}
