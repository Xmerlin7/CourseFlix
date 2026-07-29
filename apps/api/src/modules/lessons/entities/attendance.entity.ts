import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

/**
 * Mirrors `schemaV2.sql:312`. `uq_attendance_student_video` is the real
 * guarantee behind "attendance is awarded exactly once" — see
 * `attendance.service.ts`, which relies on catching this unique
 * constraint's violation rather than a read-then-write check.
 */
@Entity({ name: 'attendance' })
export class AttendanceEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ name: 'student_id', type: 'uuid' })
  studentId!: string;

  @Column({ name: 'video_id', type: 'uuid' })
  videoId!: string;

  @Column({ name: 'watched_seconds', type: 'integer', default: 0 })
  watchedSeconds!: number;

  // TypeORM returns `numeric` as a string to avoid float precision loss.
  @Column({
    name: 'watched_percentage',
    type: 'numeric',
    precision: 5,
    scale: 2,
    default: 0,
  })
  watchedPercentage!: string;

  @Column({ name: 'is_present', type: 'boolean', default: false })
  isPresent!: boolean;

  @Column({ name: 'last_heartbeat_at', type: 'timestamptz', nullable: true })
  lastHeartbeatAt!: Date | null;

  @Column({ name: 'device_session_id', type: 'text', nullable: true })
  deviceSessionId!: string | null;

  @Column({ name: 'last_updated_at', type: 'timestamptz' })
  lastUpdatedAt!: Date;
}
