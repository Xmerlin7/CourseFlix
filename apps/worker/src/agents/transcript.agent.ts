import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { BunnyCaptionsAdapter } from '../adapters/captions/bunny-captions.adapter';
import { WhisperCaptionsAdapter } from '../adapters/captions/whisper-captions.adapter';
import { YoutubeCaptionsAdapter } from '../adapters/captions/youtube-captions.adapter';
import type { CaptionProvider } from '../adapters/captions/caption-provider';
import {
  AgentFailure,
  AgentOutcome,
  AgentReporter,
  LessonAgent,
  LessonAgentContext,
} from './agent-context';
import type { LessonAgentKey } from './roster';

type TranscriptProvider = 'bunny' | 'youtube' | 'local';

/**
 * Mirrors `VideoIngestionService#detectCaptionProvider` in the API —
 * YouTube and Bunny expose a captions API, anything else directly linked
 * is transcribed locally by Whisper, and only an unparseable URL has
 * nowhere to go.
 */
function detectProvider(videoUrl: string): TranscriptProvider | null {
  let hostname: string;
  try {
    hostname = new URL(videoUrl).hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return null;
  }

  if (['youtube.com', 'youtu.be', 'm.youtube.com'].includes(hostname)) {
    return 'youtube';
  }
  if (
    ['iframe.mediadelivery.net', 'player.mediadelivery.net'].includes(hostname)
  ) {
    return 'bunny';
  }
  return 'local';
}

function formatDuration(seconds: number): string {
  const minutes = Math.round(seconds / 60);
  return minutes >= 1 ? `${minutes} دقيقة` : `${Math.round(seconds)} ثانية`;
}

/**
 * First agent in the chain: turns the lesson's video into timed text.
 *
 * It owns the `video_transcripts` row for this video, creating it or
 * bumping its version exactly the way `VideoIngestionService` does —
 * bumping matters because the teacher may be re-pointing the lesson at a
 * new URL, and the indexer uses the version to retire the old chunks.
 */
@Injectable()
export class TranscriptAgent implements LessonAgent {
  readonly key: LessonAgentKey = 'transcript';

  constructor(
    private readonly dataSource: DataSource,
    private readonly bunny: BunnyCaptionsAdapter,
    private readonly youtube: YoutubeCaptionsAdapter,
    private readonly whisper: WhisperCaptionsAdapter,
  ) {}

  async run(
    context: LessonAgentContext,
    reporter: AgentReporter,
  ): Promise<AgentOutcome> {
    const provider = detectProvider(context.video.video_url);
    if (!provider) {
      throw new AgentFailure(
        'رابط الفيديو غير صالح، فمش قادر أستخرج منه أي نص.',
      );
    }

    await reporter.progress(
      15,
      provider === 'local'
        ? 'الفيديو مش من مصدر بيوفّر ترجمة جاهزة، هفرّغه صوتيًا بنفسي.'
        : `هجيب الترجمة الجاهزة من ${provider === 'youtube' ? 'يوتيوب' : 'Bunny'}.`,
    );

    const transcript = await this.upsertTranscriptRow(context, provider);
    context.videoTranscriptId = transcript.id;
    context.transcriptVersion = transcript.version;

    await reporter.progress(35);

    const cues = await this.resolveProvider(provider).fetchCaptions(
      context.video.video_url,
    );

    if (cues.length === 0) {
      await this.markTranscriptFailed(
        transcript.id,
        'لم يتم العثور على أي نص في الفيديو.',
      );
      throw new AgentFailure(
        'مالقيتش أي كلام في الفيديو ده — اتأكد إن الفيديو فيه صوت وإن الترجمة متاحة عليه.',
      );
    }

    context.cues = cues;
    context.transcriptText = cues.map((cue) => cue.text).join(' ');

    await this.markTranscriptCompleted(transcript.id);
    await reporter.progress(100);

    const durationSeconds = cues[cues.length - 1]?.endSeconds ?? 0;

    return {
      headline: `فرّغت ${cues.length} جملة من الفيديو (${formatDuration(durationSeconds)}).`,
      output: {
        cueCount: cues.length,
        durationSeconds: Math.round(durationSeconds),
        provider,
        // A short taste of the actual words, so the teacher can tell at a
        // glance that the right video was transcribed.
        transcriptPreview: context.transcriptText.slice(0, 400),
      },
    };
  }

  private resolveProvider(provider: TranscriptProvider): CaptionProvider {
    if (provider === 'bunny') return this.bunny;
    if (provider === 'youtube') return this.youtube;
    return this.whisper;
  }

  /**
   * One `video_transcripts` row per video, versioned. A re-run against
   * the same video bumps the version rather than inserting a second row,
   * which is what lets the indexer deactivate the previous version's
   * chunks by vector-id prefix.
   */
  private async upsertTranscriptRow(
    context: LessonAgentContext,
    provider: TranscriptProvider,
  ): Promise<{ id: string; version: number }> {
    const existing = (await this.dataSource.query(
      `SELECT id, version FROM video_transcripts WHERE video_id = $1`,
      [context.video.id],
    )) as unknown as Array<{ id: string; version: number }>;

    if (existing[0]) {
      const version = Number(existing[0].version) + 1;
      await this.dataSource.query(
        `UPDATE video_transcripts
            SET course_id = $2, section_id = $3, lesson_id = $4, provider = $5,
                processing_status = 'processing', error_message = NULL, version = $6
          WHERE id = $1`,
        [
          existing[0].id,
          context.course.id,
          context.lesson.section_id,
          context.lesson.id,
          provider,
          version,
        ],
      );
      return { id: existing[0].id, version };
    }

    const inserted = (await this.dataSource.query(
      `INSERT INTO video_transcripts (
        video_id, course_id, section_id, lesson_id, provider, processing_status, version
      ) VALUES ($1, $2, $3, $4, $5, 'processing', 1)
      RETURNING id, version`,
      [
        context.video.id,
        context.course.id,
        context.lesson.section_id,
        context.lesson.id,
        provider,
      ],
    )) as unknown as Array<{ id: string; version: number }>;

    return { id: inserted[0].id, version: Number(inserted[0].version) };
  }

  private async markTranscriptCompleted(transcriptId: string): Promise<void> {
    await this.dataSource.query(
      `UPDATE video_transcripts SET processing_status = 'completed', error_message = NULL WHERE id = $1`,
      [transcriptId],
    );
  }

  private async markTranscriptFailed(
    transcriptId: string,
    message: string,
  ): Promise<void> {
    await this.dataSource.query(
      `UPDATE video_transcripts SET processing_status = 'failed', error_message = $2 WHERE id = $1`,
      [transcriptId, message],
    );
  }
}
