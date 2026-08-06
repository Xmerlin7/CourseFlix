import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

export type VideoTranscriptProvider = 'bunny' | 'youtube';
export type VideoTranscriptStatus = 'pending' | 'processing' | 'completed' | 'failed';

/**
 * Mirrors `documents` for video content — one row per video, tracking
 * caption-extraction progress. `provider` is derived from the video's
 * `videoUrl` host (Bunny Stream player vs. YouTube) at enqueue time; see
 * `video-ingestion.service.ts`.
 */
@Entity({ name: 'video_transcripts' })
export class VideoTranscriptEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ name: 'video_id', type: 'uuid' })
  videoId!: string;

  @Index()
  @Column({ name: 'course_id', type: 'uuid' })
  courseId!: string;

  @Index()
  @Column({ name: 'section_id', type: 'uuid', nullable: true })
  sectionId!: string | null;

  @Index()
  @Column({ name: 'lesson_id', type: 'uuid', nullable: true })
  lessonId!: string | null;

  @Column({
    type: 'enum',
    enum: ['bunny', 'youtube'],
    enumName: 'video_transcript_provider',
  })
  provider!: VideoTranscriptProvider;

  @Column({
    name: 'processing_status',
    type: 'enum',
    enum: ['pending', 'processing', 'completed', 'failed'],
    enumName: 'processing_status_type',
    default: 'pending',
  })
  processingStatus!: VideoTranscriptStatus;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage!: string | null;

  @Column({ type: 'integer', default: 1 })
  version!: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
