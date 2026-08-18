import { Inject, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ChromaAdapter } from '../adapters/chroma.adapter';
import type { EmbeddingProvider } from '../adapters/embedding.adapter';
import { EMBEDDING_PROVIDER } from '../adapters/embedding.adapter';
import { chunkCaptions, VideoChunk } from '../stages/caption-chunk.stage';
import {
  AgentFailure,
  AgentOutcome,
  AgentReporter,
  LessonAgent,
  LessonAgentContext,
} from './agent-context';
import type { LessonAgentKey } from './roster';

/**
 * Third agent, and the reason the first three can't be switched off:
 * this is what turns a transcript into something a student can ask
 * questions about.
 *
 * The work is deliberately identical to `VideoIngestionProcessor`'s —
 * same chunker, same `video:`-prefixed vector ids, same
 * `video_chunks` rows, same version retirement — so a lesson built by
 * agents is indistinguishable to `RetrievalService` from one uploaded
 * the plain way. Nothing downstream needs to know which path produced
 * it.
 */
@Injectable()
export class IndexerAgent implements LessonAgent {
  readonly key: LessonAgentKey = 'indexer';

  constructor(
    private readonly dataSource: DataSource,
    @Inject(EMBEDDING_PROVIDER)
    private readonly embeddingProvider: EmbeddingProvider,
    private readonly chromaAdapter: ChromaAdapter,
  ) {}

  async run(
    context: LessonAgentContext,
    reporter: AgentReporter,
  ): Promise<AgentOutcome> {
    const transcriptId = context.videoTranscriptId;
    const version = context.transcriptVersion;
    if (!transcriptId || !version || !context.cues) {
      throw new AgentFailure('مستلمتش نص من المُفرِّغ، فمش قادر أفهرس.');
    }

    await reporter.progress(20, 'بقسّم النص لمقاطع صغيرة عشان الإجابات تبقى دقيقة ومربوطة بتوقيتها.');

    const chunks = chunkCaptions({
      videoTranscriptId: transcriptId,
      version,
      cues: context.cues,
    });

    if (chunks.length === 0) {
      throw new AgentFailure('النص قصير جدًا لدرجة إنه ما طلعش أي مقاطع.');
    }

    await reporter.progress(
      50,
      `طلعت ${chunks.length} مقطع، وبحوّلهم لتمثيل رقمي عشان البحث الدلالي.`,
    );

    const vectors = await this.embeddingProvider.embed(
      chunks.map((chunk) => chunk.text),
    );
    if (vectors.length !== chunks.length) {
      throw new AgentFailure(
        `عدد التمثيلات مش مطابق لعدد المقاطع (${vectors.length} مقابل ${chunks.length}).`,
      );
    }

    await reporter.progress(80, 'بخزّن الفهرس.');

    await this.upsertVectors(context, transcriptId, chunks, vectors);
    await this.persistChunks(transcriptId, chunks);

    if (version > 1) {
      await this.retirePreviousVersions(transcriptId, version);
      await reporter.note('شلت فهرس النسخة القديمة من الفيديو.');
    }

    await reporter.progress(100);

    return {
      headline: `فهرست ${chunks.length} مقطع — الطالب يقدر يسأل في الدرس ده دلوقتي.`,
      output: { chunkCount: chunks.length, embeddedCount: vectors.length },
    };
  }

  /**
   * `video:` prefix keeps these ids disjoint from a document chunk's
   * `${documentId}:${version}:${chunkIndex}`, so the tutor's document
   * retrieval can never accidentally join a video chunk — the same
   * invariant `VideoIngestionProcessor` maintains.
   */
  private async upsertVectors(
    context: LessonAgentContext,
    transcriptId: string,
    chunks: VideoChunk[],
    vectors: number[][],
  ): Promise<void> {
    const collection = await this.chromaAdapter.getCollection();

    await collection.upsert({
      ids: chunks.map(
        (chunk) => `video:${transcriptId}:${chunk.version}:${chunk.chunkIndex}`,
      ),
      embeddings: vectors,
      documents: chunks.map((chunk) => chunk.text),
      metadatas: chunks.map((chunk) => ({
        courseId: context.course.id,
        videoTranscriptId: transcriptId,
        chunkIndex: chunk.chunkIndex,
        startSeconds: chunk.startSeconds,
        isActive: true,
      })),
    });
  }

  private async persistChunks(
    transcriptId: string,
    chunks: VideoChunk[],
  ): Promise<void> {
    for (const chunk of chunks) {
      await this.dataSource.query(
        `INSERT INTO video_chunks (
          video_transcript_id, chunk_index, text_preview, vector_id,
          start_seconds, end_seconds, token_count, is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, true)`,
        [
          transcriptId,
          chunk.chunkIndex,
          chunk.text.slice(0, 300),
          `video:${transcriptId}:${chunk.version}:${chunk.chunkIndex}`,
          chunk.startSeconds,
          chunk.endSeconds,
          chunk.tokenCount,
        ],
      );
    }
  }

  private async retirePreviousVersions(
    transcriptId: string,
    currentVersion: number,
  ): Promise<void> {
    await this.dataSource.query(
      `UPDATE video_chunks
          SET is_active = false
        WHERE video_transcript_id = $1
          AND vector_id NOT LIKE $2`,
      [transcriptId, `video:${transcriptId}:${currentVersion}:%`],
    );
  }
}
