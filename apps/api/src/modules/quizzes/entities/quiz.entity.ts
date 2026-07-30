import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export type QuizGenerationType = 'manual' | 'rag_generated';

@Entity({ name: 'quizzes' })
export class QuizEntity {
  @PrimaryGeneratedColumn('uuid') id!: string;

  @Index()
  @Column({ name: 'course_id', type: 'uuid' })
  courseId!: string;

  @Column({ name: 'section_id', type: 'uuid', nullable: true }) sectionId!:
    string | null;

  @Index()
  @Column({ name: 'lesson_id', type: 'uuid', nullable: true })
  lessonId!: string | null;

  @Column({ name: 'created_by', type: 'uuid', nullable: true }) createdBy!:
    string | null;

  @Column({
    type: 'enum',
    enum: ['manual', 'rag_generated'],
    enumName: 'quiz_generation_type',
    default: 'manual',
  })
  generationType!: QuizGenerationType;

  @Column({ type: 'text' }) title!: string;

  @Column({ type: 'integer', default: 1 }) version!: number;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt!: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
