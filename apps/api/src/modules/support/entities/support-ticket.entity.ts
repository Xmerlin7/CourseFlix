import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export type SupportTicketCategory =
  | 'technical'
  | 'course'
  | 'payment'
  | 'account'
  | 'other';

export type SupportTicketStatus =
  | 'open'
  | 'in_progress'
  | 'waiting_for_student'
  | 'resolved'
  | 'closed';

/**
 * `studentId`/`courseId`/`assignedTo` are plain UUID columns (no
 * relations), matching `enrollment.entity.ts`, to avoid a module import
 * cycle with UsersModule/CoursesModule.
 */
@Entity({ name: 'support_tickets' })
export class SupportTicketEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('idx_support_tickets_student_id')
  @Column({ name: 'student_id', type: 'uuid' })
  studentId!: string;

  @Column({ name: 'course_id', type: 'uuid', nullable: true })
  courseId!: string | null;

  @Column({
    type: 'enum',
    enum: ['technical', 'course', 'payment', 'account', 'other'],
    enumName: 'support_ticket_category',
  })
  category!: SupportTicketCategory;

  @Column({ type: 'text' })
  subject!: string;

  @Column({ type: 'text' })
  description!: string;

  @Index('idx_support_tickets_status')
  @Column({
    type: 'enum',
    enum: ['open', 'in_progress', 'waiting_for_student', 'resolved', 'closed'],
    enumName: 'support_ticket_status',
    default: 'open',
  })
  status!: SupportTicketStatus;

  @Column({ name: 'assigned_to', type: 'uuid', nullable: true })
  assignedTo!: string | null;

  @Column({ name: 'resolved_at', type: 'timestamptz', nullable: true })
  resolvedAt!: Date | null;

  @Column({ name: 'closed_at', type: 'timestamptz', nullable: true })
  closedAt!: Date | null;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt!: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
