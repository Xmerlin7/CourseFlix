export class LessonEntity {
  // TODO: convert to TypeORM entity with section relation.
  id!: string;
  sectionId!: string;
  title!: string;
  videoUrl!: string | null;
  sortOrder!: number;
}
