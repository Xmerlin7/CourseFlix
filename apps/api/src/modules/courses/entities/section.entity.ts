export class SectionEntity {
  // TODO: convert to TypeORM entity with course relation and ordered lessons.
  id!: string;
  courseId!: string;
  title!: string;
  sortOrder!: number;
}
