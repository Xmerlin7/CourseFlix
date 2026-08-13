import {
  Column,
  DeleteDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

export type VideoType = 'recorded' | 'live';
export type VideoStatus = 'scheduled' | 'live' | 'ended' | 'recorded';
export type VideoModerationStatus = 'pending' | 'approved' | 'rejected';

/**
 * Mirrors `schemaV2.sql:297`. Authoritative for playback, progress, and
 * attendance this sprint — see `docs/api/sprint2-lessons.md` for why this
 * table exists instead of Sprint 1's `lessons.video_url`.
 *
 * `minAttendancePercentage` is carried over from the schema but unused by
 * `AttendanceService` this sprint, which reads the global
 * `ATTENDANCE_THRESHOLD_PERCENT` env var instead — a per-video override is
 * Sprint 3 scope.
 */
@Entity({ name: 'videos' })
export class VideoEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ name: 'course_id', type: 'uuid' })
  courseId!: string;

  @Column({ name: 'section_id', type: 'uuid', nullable: true })
  sectionId!: string | null;

  @Index()
  @Column({ name: 'lesson_id', type: 'uuid', nullable: true })
  lessonId!: string | null;

  @Column({ type: 'text' })
  title!: string;

  @Column({ name: 'video_url', type: 'text' })
  videoUrl!: string;

  @Column({
    type: 'enum',
    enum: ['recorded', 'live'],
    enumName: 'video_type',
  })
  type!: VideoType;

  @Column({ name: 'duration_seconds', type: 'integer', nullable: true })
  durationSeconds!: number | null;

  @Column({
    type: 'enum',
    enum: ['scheduled', 'live', 'ended', 'recorded'],
    enumName: 'video_status',
    default: 'scheduled',
  })
  status!: VideoStatus;

  @Column({ name: 'scheduled_at', type: 'timestamptz', nullable: true })
  scheduledAt!: Date | null;

  @Column({
    name: 'min_attendance_percentage',
    type: 'numeric',
    precision: 5,
    scale: 2,
    default: 80,
  })
  minAttendancePercentage!: string;

  // YouTube uploads start `pending` and are gated from students until the
  // worker's caption-safety + subject-relevance check clears them (see
  // VideoIngestionProcessor); Bunny/local videos are set `approved`
  // immediately in CoursesService.syncLessonVideo, unaffected by this gate.
  @Column({
    name: 'moderation_status',
    type: 'enum',
    enum: ['pending', 'approved', 'rejected'],
    enumName: 'video_moderation_status',
    default: 'approved',
  })
  moderationStatus!: VideoModerationStatus;

  @Column({ name: 'moderation_reason', type: 'text', nullable: true })
  moderationReason!: string | null;

  @Column({
    name: 'moderation_checked_at',
    type: 'timestamptz',
    nullable: true,
  })
  moderationCheckedAt!: Date | null;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt!: Date | null;
}
