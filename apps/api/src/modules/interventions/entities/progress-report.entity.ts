import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

/**
 * Mirrors `progress_reports` from `1785000061000-CreateProgressReports.ts`.
 * `studentId`/`courseId`/`teacherId`/`relatedQuizId` stay plain UUID
 * columns (no relation), matching `enrollment.entity.ts`.
 */
@Entity({ name: 'progress_reports' })
export class ProgressReportEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('idx_progress_reports_student_course')
  @Column({ name: 'student_id', type: 'uuid' })
  studentId!: string;

  @Column({ name: 'course_id', type: 'uuid' })
  courseId!: string;

  @Index('idx_progress_reports_teacher')
  @Column({ name: 'teacher_id', type: 'uuid' })
  teacherId!: string;

  @Column({ name: 'flagged_concept', type: 'text' })
  flaggedConcept!: string;

  @Column({ name: 'related_quiz_id', type: 'uuid', nullable: true })
  relatedQuizId!: string | null;

  @Column({ name: 'teacher_notified', type: 'boolean', default: false })
  teacherNotified!: boolean;

  @Column({ name: 'email_sent_at', type: 'timestamptz', nullable: true })
  emailSentAt!: Date | null;

  @Column({ name: 'intervention_id', type: 'uuid', nullable: true })
  interventionId!: string | null;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt!: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
