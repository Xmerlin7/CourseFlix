import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'quiz_submissions' })
export class QuizSubmissionEntity {
  @PrimaryGeneratedColumn('uuid') id!: string;

  @Index()
  @Column({ name: 'quiz_id', type: 'uuid' })
  quizId!: string;

  @Column({ name: 'student_id', type: 'uuid' }) studentId!: string;

  @Column({ type: 'numeric', precision: 6, scale: 2 }) score!: number;

  @Column({ name: 'quiz_version', type: 'integer' }) quizVersion!: number;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt!: Date | null;

  @CreateDateColumn({ name: 'submitted_at', type: 'timestamptz' })
  submittedAt!: Date;
}
