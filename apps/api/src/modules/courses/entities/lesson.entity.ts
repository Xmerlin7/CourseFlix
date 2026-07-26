import {
  Column,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { SectionEntity } from './section.entity';

export type LessonStatus = 'draft' | 'published';

@Entity({ name: 'lessons' })
export class LessonEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'section_id', type: 'uuid' })
  sectionId!: string;

  @ManyToOne(() => SectionEntity, (section) => section.lessons, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'section_id' })
  section?: SectionEntity;

  // Denormalized for fast lookups, matching `schemaV2.sql`'s lessons table.
  @Index()
  @Column({ name: 'course_id', type: 'uuid' })
  courseId!: string;

  @Column({ type: 'text' })
  title!: string;

  @Column({ name: 'video_url', type: 'text', nullable: true })
  videoUrl!: string | null;

  @Index()
  @Column({ name: 'order_index', type: 'integer' })
  sortOrder!: number;

  @Column({
    type: 'enum',
    enum: ['draft', 'published'],
    enumName: 'content_status',
    default: 'published',
  })
  status!: LessonStatus;

  // Soft delete — every read query must filter `deletedAt IS NULL`.
  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt!: Date | null;
}
