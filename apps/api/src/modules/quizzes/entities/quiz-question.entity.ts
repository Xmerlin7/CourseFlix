import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { QuizEntity } from './quiz.entity';

@Entity({ name: 'quiz_questions' })
export class QuizQuestionEntity {
  @PrimaryColumn({ name: 'quiz_id', type: 'uuid' }) quizId!: string;

  @PrimaryColumn({ name: 'question_id', type: 'uuid' }) questionId!: string;

  @Column({ name: 'order_index', type: 'integer', default: 0 })
  orderIndex!: number;

  @ManyToOne(() => QuizEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'quiz_id' })
  quiz?: QuizEntity;
}
