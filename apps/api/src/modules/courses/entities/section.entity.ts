import {
  Column,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { CourseEntity } from './course.entity';
import { LessonEntity } from './lesson.entity';

export type SectionStatus = 'draft' | 'published';

@Entity({ name: 'sections' })
export class SectionEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'course_id', type: 'uuid' })
  courseId!: string;

  @ManyToOne(() => CourseEntity, (course) => course.sections, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'course_id' })
  course?: CourseEntity;

  @Column({ type: 'text' })
  title!: string;

  @Index()
  @Column({ name: 'order_index', type: 'integer' })
  sortOrder!: number;

  @Column({
    type: 'enum',
    enum: ['draft', 'published'],
    enumName: 'content_status',
    default: 'published',
  })
  status!: SectionStatus;

  @OneToMany(() => LessonEntity, (lesson) => lesson.section)
  lessons?: LessonEntity[];

  // Soft delete — every read query must filter `deletedAt IS NULL`.
  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt!: Date | null;
}
