import { Inject, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import type { VideoModerationProvider } from '../adapters/video-moderation-llm.adapter';
import { VIDEO_MODERATION_PROVIDER } from '../adapters/video-moderation-llm.adapter';
import {
  AgentFailure,
  AgentOutcome,
  AgentReporter,
  LessonAgent,
  LessonAgentContext,
} from './agent-context';
import type { LessonAgentKey } from './roster';

// Same budget as `VideoIngestionProcessor.MAX_MODERATION_CHARS` — a full
// lecture transcript is far more than the check needs, and the opening
// stretch is where an off-topic video gives itself away.
const MAX_MODERATION_CHARS = 20_000;

/**
 * Second agent: the gate. It reads what the transcriber produced and
 * decides whether this video belongs in front of students at all.
 *
 * Unlike `VideoIngestionProcessor` — which only moderates YouTube, since
 * that is the one source a teacher can point at arbitrary third-party
 * content — this agent checks every source. A teacher who explicitly
 * asked for an agent review is asking for exactly that, whatever the
 * video is hosted on.
 *
 * A rejection stops the whole run: there is no point indexing, writing a
 * handout about, or setting questions on a video that won't be shown.
 */
@Injectable()
export class ReviewerAgent implements LessonAgent {
  readonly key: LessonAgentKey = 'reviewer';

  constructor(
    private readonly dataSource: DataSource,
    @Inject(VIDEO_MODERATION_PROVIDER)
    private readonly moderationProvider: VideoModerationProvider,
  ) {}

  async run(
    context: LessonAgentContext,
    reporter: AgentReporter,
  ): Promise<AgentOutcome> {
    const transcriptText = (context.transcriptText ?? '').slice(
      0,
      MAX_MODERATION_CHARS,
    );
    if (!transcriptText.trim()) {
      throw new AgentFailure('مفيش نص أراجعه — المُفرِّغ ما سلّمش حاجة.');
    }

    await reporter.progress(40, 'بفحص المحتوى: أمان الطلاب أولًا، وبعدين مدى ارتباطه بالمادة.');

    const result = await this.moderationProvider.checkCaptions({
      videoTitle: context.video.title,
      courseTitle: context.course.title,
      transcriptText,
    });

    // Safety first, relevance second: an unsafe video's topic is beside
    // the point, and this is the same two-stage order the plain
    // ingestion path uses.
    const rejectionReason = !result.safe
      ? (result.unsafeReason ?? 'المحتوى غير لائق للطلاب.')
      : !result.onTopic
        ? (result.offTopicReason ?? 'المحتوى لا يتعلق بمادة الدورة.')
        : null;

    if (rejectionReason) {
      await this.setModeration(context.video.id, 'rejected', rejectionReason);
      await reporter.note(`رفضت الفيديو: ${rejectionReason}`);
      throw new AgentFailure(`الفيديو اترفض بعد المراجعة: ${rejectionReason}`);
    }

    await this.setModeration(context.video.id, 'approved', null);
    await reporter.progress(100);

    return {
      headline: 'الفيديو عدّى المراجعة: محتوى آمن وفي صميم المادة.',
      output: { verdict: 'approved' as const },
    };
  }

  private async setModeration(
    videoId: string,
    status: 'approved' | 'rejected',
    reason: string | null,
  ): Promise<void> {
    await this.dataSource.query(
      `UPDATE videos
          SET moderation_status = $2,
              moderation_reason = $3,
              moderation_checked_at = NOW()
        WHERE id = $1`,
      [videoId, status, reason],
    );
  }
}
