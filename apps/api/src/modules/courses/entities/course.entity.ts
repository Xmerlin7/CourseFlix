import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserEntity } from '../../users/entities/user.entity';
import { SectionEntity } from './section.entity';

export type CourseStatus = 'draft' | 'published' | 'archived';

/**
 * Sprint 1 subset of the `courses` table in `schemaV2.sql`.
 *
 * Two intentional deviations from `schemaV2.sql`, both authorized as
 * MVP gap-fill (see sprint1-plan.md "Sprint 1 Endpoint Contract" and
 * courseflix-scrum-jira-plan.md's "Missing UI screens/states: Authorized"
 * decision):
 *  - `slug`: not in schemaV2.sql; added because the shared course shape
 *    in sprint1-plan.md requires it. Server-generated only; not
 *    teacher-editable (see UpdateCourseDto).
 *  - `gradeLevel` replaces schemaV2.sql's `category` column: the `ui5`
 *    prototype only ever displays a grade label (e.g. "الصف الأول
 *    الثانوي" in dashboard.html/courses.html), never a separate
 *    category, and the Sprint 1 contract names the field `gradeLevel`
 *    explicitly. `enrollments.service.ts` had left this unresolved
 *    pending this decision — resolving it here.
 */
@Entity({ name: 'courses' })
export class CourseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'teacher_id', type: 'uuid' })
  teacherId!: string;

  @ManyToOne(() => UserEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'teacher_id' })
  teacher?: UserEntity;

  @Column({ type: 'text' })
  title!: string;

  @Index('uq_courses_slug', { unique: true })
  @Column({ type: 'text' })
  slug!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ name: 'cover_image_url', type: 'text', nullable: true })
  coverImageUrl!: string | null;

  @Column({ name: 'grade_level', type: 'text', nullable: true })
  gradeLevel!: string | null;

  @Column({
    type: 'enum',
    enum: ['draft', 'published', 'archived'],
    enumName: 'course_status',
    default: 'draft',
  })
  status!: CourseStatus;

  @OneToMany(() => SectionEntity, (section) => section.course)
  sections?: SectionEntity[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  // Soft delete — every read query must filter `deletedAt IS NULL`.
  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt!: Date | null;
}
