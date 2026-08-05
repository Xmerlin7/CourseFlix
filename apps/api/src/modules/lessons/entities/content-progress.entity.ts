import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

export type ContentProgressStatus = 'not_started' | 'in_progress' | 'completed';
export type ContentProgressItemType = 'video' | 'quiz' | 'homework' | 'lesson';

/**
 * Mirrors `schemaV2.sql:590`, narrowed to `video`/`lesson` item types this
 * sprint — see the migration docblock and `docs/api/sprint2-lessons.md`
 * for the reasoning. `quizId`/`homeworkId` do not exist as columns yet;
 * do not add them without a matching migration and CHECK update.
 */
@Entity({ name: 'content_progress' })
export class ContentProgressEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ name: 'student_id', type: 'uuid' })
  studentId!: string;

  @Index()
  @Column({ name: 'course_id', type: 'uuid' })
  courseId!: string;

  @Column({
    name: 'item_type',
    type: 'enum',
    enum: ['video', 'quiz', 'homework', 'lesson'],
    enumName: 'content_progress_item_type',
  })
  itemType!: ContentProgressItemType;

  @Index()
  @Column({ name: 'video_id', type: 'uuid', nullable: true })
  videoId!: string | null;

  @Column({ name: 'lesson_id', type: 'uuid', nullable: true })
  lessonId!: string | null;

  @Column({
    type: 'enum',
    enum: ['not_started', 'in_progress', 'completed'],
    enumName: 'content_progress_status',
    default: 'not_started',
  })
  status!: ContentProgressStatus;

  // TypeORM returns `numeric` as a string to avoid float precision loss.
  @Column({
    name: 'progress_percentage',
    type: 'numeric',
    precision: 5,
    scale: 2,
    default: 0,
    nullable: true,
  })
  progressPercentage!: string | null;

  @Column({ name: 'last_video_position', type: 'integer', nullable: true })
  lastVideoPosition!: number | null;

  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt!: Date | null;

  // Unused for `video`/`lesson` rows this sprint; carried over from the
  // shared schema shape for quiz/homework progress rows in Sprint 3.
  @Column({
    type: 'numeric',
    precision: 6,
    scale: 2,
    nullable: true,
  })
  score!: string | null;
}
