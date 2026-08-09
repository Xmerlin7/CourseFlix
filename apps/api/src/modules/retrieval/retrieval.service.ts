import { Inject, Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import {
  RetrievalPort,
  SearchQueryInput,
  RetrievedChunk,
  SearchVideoQueryInput,
  RetrievedVideoChunk,
} from '../../common/ports/retrieval.port';
import type { EmbeddingProvider } from './embedding.adapter';
import { EMBEDDING_PROVIDER } from './embedding.adapter';

interface DocumentChunkRow {
  id: string;
  vector_id: string;
  document_id: string;
  page_number: number | null;
  distance: number | null;
  excerpt: string | null;
}

interface VideoChunkRow {
  id: string;
  vector_id: string;
  video_transcript_id: string;
  start_seconds: number | null;
  end_seconds: number | null;
  distance: number | null;
  excerpt: string | null;
}

/** Renders a JS float array as a pgvector literal string, e.g. `[0.1,0.2]`. */
export function toVectorLiteral(embedding: number[]): string {
  return `[${embedding.join(',')}]`;
}

/**
 * pgvector-backed retrieval.
 *
 * Queries the `document_chunks` / `video_chunks` tables directly, ordered
 * by cosine distance (`<=>`) against the query embedding. The chunk's
 * full text lives in `text_content` (backfilled from `text_preview` when
 * it predates the pgvector migration).
 *
 * Score semantics are unchanged from ChromaDB: smaller distance = more
 * relevant, and the existing `TUTOR_MAX_DISTANCE` cutoff still applies.
 */
@Injectable()
export class RetrievalService implements RetrievalPort {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    @Inject(EMBEDDING_PROVIDER)
    private readonly embeddingProvider: EmbeddingProvider,
  ) {}

  async search(input: SearchQueryInput): Promise<RetrievedChunk[]> {
    const { courseId, query, topK = 5 } = input;

    if (!courseId) {
      throw new Error('Retrieval search failed: courseId is required');
    }

    if (!query || !query.trim()) {
      return [];
    }

    const [queryVector] = await this.embeddingProvider.embed([query]);
    if (!queryVector || queryVector.length === 0) {
      return [];
    }

    // Mandatory courseId + isActive isolation filter, enforced in SQL so
    // a chunk from another course can never leak into the results.
    const rows = (await this.dataSource.query(
      `SELECT c.id, c.vector_id, c.document_id, c.page_number,
              c.embedding <=> $2::vector AS distance,
              COALESCE(c.text_content, c.text_preview) AS excerpt
         FROM document_chunks c
         JOIN documents d ON d.id = c.document_id
        WHERE d.course_id = $1
          AND c.is_active = true
        ORDER BY c.embedding <=> $2::vector
        LIMIT $3`,
      [courseId, toVectorLiteral(queryVector), topK],
    )) as unknown as DocumentChunkRow[];

    return rows.map((row) => ({
      chunkId: row.id,
      vectorId: row.vector_id,
      documentId: row.document_id,
      page: row.page_number ?? 0,
      excerpt: row.excerpt ?? '',
      score: row.distance ?? 0,
    }));
  }

  async searchVideo(
    input: SearchVideoQueryInput,
  ): Promise<RetrievedVideoChunk[]> {
    const { videoTranscriptId, query, topK = 5 } = input;

    if (!videoTranscriptId) {
      throw new Error('Retrieval search failed: videoTranscriptId is required');
    }

    if (!query || !query.trim()) {
      return [];
    }

    const [queryVector] = await this.embeddingProvider.embed([query]);
    if (!queryVector || queryVector.length === 0) {
      return [];
    }

    // Mandatory videoTranscriptId + isActive isolation filter.
    const rows = (await this.dataSource.query(
      `SELECT id, vector_id, video_transcript_id, start_seconds, end_seconds,
              embedding <=> $2::vector AS distance,
              COALESCE(text_content, text_preview) AS excerpt
         FROM video_chunks
        WHERE video_transcript_id = $1
          AND is_active = true
        ORDER BY embedding <=> $2::vector
        LIMIT $3`,
      [videoTranscriptId, toVectorLiteral(queryVector), topK],
    )) as unknown as VideoChunkRow[];

    return rows.map((row) => ({
      chunkId: row.id,
      vectorId: row.vector_id,
      videoTranscriptId: row.video_transcript_id,
      startSeconds: row.start_seconds,
      endSeconds: row.end_seconds,
      excerpt: row.excerpt ?? '',
      score: row.distance ?? 0,
    }));
  }
}
