import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AnswerPolicyService {
  constructor(private readonly configService: ConfigService) {}

  // Generic over any chunk with a `score` field so it applies equally to
  // course-document chunks (Tutor) and video-transcript chunks (Video Q&A).
  //
  // `configKey` lets a caller use its own threshold instead of Tutor's.
  // Video Q&A needs one: its corpus is a single video's own handful of
  // chunks (already isolated by videoTranscriptId), not a whole course's
  // documents, so a near-miss is far less likely to be *wrong* — just
  // phrased differently than the transcript's own words. Measured directly
  // against a real video: "لخص الفيديو" (summarize) scored 1.76 and "ايه
  // اللي اتقال في الدقيقة الثالثة؟" (what was said at minute 3) scored
  // 1.56 — both meta-questions about content that was, in fact, right
  // there in the video's only chunk — while Tutor's cross-document 1.35
  // default was silently rejecting them before the LLM ever ran.
  getRelevantChunks<T extends { score: number }>(
    chunks: T[],
    configKey: string = 'TUTOR_MAX_DISTANCE',
    defaultMaxDistance: number = 1.35,
  ): T[] {
    const maxDistance = Number(
      this.configService.get<string>(configKey) ?? defaultMaxDistance,
    );

    return chunks.filter((chunk) => Number(chunk.score) <= maxDistance);
  }
}
