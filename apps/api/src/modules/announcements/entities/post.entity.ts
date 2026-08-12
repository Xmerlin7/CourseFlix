import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * A teacher's course-wide announcement. Mirrors schemaV2.sql's `posts`
 * table plus `pinnedAt` — see the migration's docblock.
 *
 * `courseId`/`teacherId` are plain UUID columns (no relations), matching
 * `enrollment.entity.ts`, to avoid a module import cycle.
 */
@Entity({ name: 'posts' })
export class PostEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('idx_posts_course_id')
  @Column({ name: 'course_id', type: 'uuid' })
  courseId!: string;

  @Column({ name: 'teacher_id', type: 'uuid' })
  teacherId!: string;

  @Column({ type: 'text' })
  content!: string;

  @Column({ name: 'pinned_at', type: 'timestamptz', nullable: true })
  pinnedAt!: Date | null;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt!: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
