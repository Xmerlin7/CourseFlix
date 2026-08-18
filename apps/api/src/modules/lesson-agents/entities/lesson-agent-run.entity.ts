import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import type { LessonAgentRunConfig } from '../lesson-agents.constants';

export type LessonAgentRunStatus =
  | 'queued'
  | 'running'
  | 'pending_review'
  | 'completed'
  | 'failed';

/**
 * One execution of the agent pipeline over a single lesson.
 *
 * `pending_review` is the resting state the run sits in once every agent
 * has produced something: the worker is done, but the reviewable outputs
 * (handout, quiz) are still drafts. It only becomes `completed` when the
 * teacher publishes, which is also the moment those drafts become
 * visible to students.
 *
 * All FKs are plain UUID columns, matching `enrollment.entity.ts`, to
 * keep this module free of import cycles with `CoursesModule`.
 */
@Entity({ name: 'lesson_agent_runs' })
export class LessonAgentRunEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ name: 'lesson_id', type: 'uuid' })
  lessonId!: string;

  @Index()
  @Column({ name: 'course_id', type: 'uuid' })
  courseId!: string;

  // Null until `CoursesService` has synced the lesson's `videos` row —
  // the run is created the instant the teacher submits, which can race
  // that sync.
  @Column({ name: 'video_id', type: 'uuid', nullable: true })
  videoId!: string | null;

  @Index()
  @Column({ name: 'teacher_id', type: 'uuid' })
  teacherId!: string;

  @Column({
    type: 'enum',
    enum: ['queued', 'running', 'pending_review', 'completed', 'failed'],
    enumName: 'lesson_agent_run_status',
    default: 'queued',
  })
  status!: LessonAgentRunStatus;

  // Snapshot of the teacher's settings at submit time — never re-read
  // from `teacher_agent_settings`, so editing settings can't rewrite
  // what an in-flight or finished run says it did.
  @Column({ type: 'jsonb' })
  config!: LessonAgentRunConfig;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage!: string | null;

  @Column({ name: 'started_at', type: 'timestamptz', nullable: true })
  startedAt!: Date | null;

  @Column({ name: 'finished_at', type: 'timestamptz', nullable: true })
  finishedAt!: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
