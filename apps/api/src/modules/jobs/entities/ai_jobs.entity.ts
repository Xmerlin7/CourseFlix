import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

export type AiJobStatus = 'queued' | 'processing' | 'completed' | 'failed';

/**
 * Mirrors the `ai_jobs` table in `schemaV2.sql`.
 *
 * Tracks every asynchronous AI task processed by the worker.
 * `targetEntityType` and `targetEntityId` form a polymorphic reference,
 * so no foreign key is enforced by design.
 */
@Entity({ name: 'ai_jobs' })
export class AiJobEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'job_type', type: 'text' })
  jobType!: string;

  @Column({
    type: 'enum',
    enum: ['queued', 'processing', 'completed', 'failed'],
    enumName: 'ai_job_status',
    default: 'queued',
  })
  status!: AiJobStatus;

  @Column({ type: 'integer', default: 0 })
  priority!: number;

  @Column({ type: 'integer', default: 0 })
  retries!: number;

  @Column({
    name: 'target_entity_type',
    type: 'text',
    nullable: true,
  })
  targetEntityType!: string | null;

  @Column({
    name: 'target_entity_id',
    type: 'uuid',
  })
  targetEntityId!: string;

  @Column({
    name: 'started_at',
    type: 'timestamptz',
    nullable: true,
  })
  startedAt!: Date | null;

  @Column({
    name: 'finished_at',
    type: 'timestamptz',
    nullable: true,
  })
  finishedAt!: Date | null;

  @Column({
    name: 'error_message',
    type: 'text',
    nullable: true,
  })
  errorMessage!: string | null;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamptz',
  })
  createdAt!: Date;
}
