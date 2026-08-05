import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'quiz_submission_answers' })
export class QuizSubmissionAnswerEntity {
  @PrimaryGeneratedColumn('uuid') id!: string;

  @Column({ name: 'submission_id', type: 'uuid' }) submissionId!: string;

  @Column({ name: 'question_id', type: 'uuid' }) questionId!: string;

  @Column({ name: 'selected_answer', type: 'text', nullable: true })
  selectedAnswer!: string | null;

  @Column({ name: 'is_correct', type: 'boolean', nullable: true }) isCorrect!:
    boolean | null;
}
