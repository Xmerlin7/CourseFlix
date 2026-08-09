import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import type { DocumentChunk } from '../stages/chunk.stage';
import type { VideoChunk } from '../stages/caption-chunk.stage';

export interface VectorStoreUpsertItem<ChunkT> {
  chunk: ChunkT;
  courseId: string;
  vector: number[];
  isActive?: boolean;
}

/** Renders a JS float array as a pgvector literal string, e.g. `[0.1,0.2]`. */
export function toVectorLiteral(embedding: number[]): string {
  return `[${embedding.join(',')}]`;
}

/**
 * pgvector vector-store adapter.
 *
 * Persists document/video chunk embeddings directly onto their Postgres
 * rows, replacing the external ChromaDB collection. Vector IDs keep the
 * same deterministic format as before (`${documentId}:${version}:${chunkIndex}`
 * and `video:${transcriptId}:${version}:${chunkIndex}`) so the `vector_id`
 * column remains the bridge between relational and vector data.
 *
 * Inserts are idempotent (ON CONFLICT vector_id), so a retried job never
 * duplicates a chunk or its embedding.
 */
@Injectable()
export class VectorStoreAdapter {
  private readonly logger = new Logger(VectorStoreAdapter.name);

  constructor(private readonly dataSource: DataSource) {}

  async upsertDocumentChunks(
    items: VectorStoreUpsertItem<DocumentChunk>[],
  ): Promise<void> {
    if (items.length === 0) {
      return;
    }

    for (const item of items) {
      const { chunk, courseId, vector, isActive = true } = item;

      this.validateMetadata({
        courseId,
        documentId: chunk.documentId,
        version: chunk.version,
        chunkIndex: chunk.chunkIndex,
        page: chunk.page,
      });

      const vectorId = `${chunk.documentId}:${chunk.version}:${chunk.chunkIndex}`;

      await this.dataSource.query(
        `INSERT INTO document_chunks (
          document_id, chunk_index, text_preview, text_content, vector_id,
          page_number, token_count, is_active, embedding
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::vector)
        ON CONFLICT (vector_id) DO UPDATE SET
          document_id = EXCLUDED.document_id,
          chunk_index = EXCLUDED.chunk_index,
          text_preview = EXCLUDED.text_preview,
          text_content = EXCLUDED.text_content,
          page_number = EXCLUDED.page_number,
          token_count = EXCLUDED.token_count,
          is_active = EXCLUDED.is_active,
          embedding = EXCLUDED.embedding`,
        [
          chunk.documentId,
          chunk.chunkIndex,
          chunk.text.slice(0, 300),
          chunk.text,
          vectorId,
          chunk.page,
          chunk.tokenCount,
          isActive,
          toVectorLiteral(vector),
        ],
      );
    }

    this.logger.log(
      `Upserted ${items.length} document chunk embeddings into Postgres`,
    );
  }

  async upsertVideoChunks(
    items: VectorStoreUpsertItem<VideoChunk>[],
  ): Promise<void> {
    if (items.length === 0) {
      return;
    }

    for (const item of items) {
      const { chunk, courseId, vector, isActive = true } = item;

      this.validateMetadata({
        courseId,
        documentId: chunk.videoTranscriptId,
        version: chunk.version,
        chunkIndex: chunk.chunkIndex,
        page: 1,
      });

      const vectorId = `video:${chunk.videoTranscriptId}:${chunk.version}:${chunk.chunkIndex}`;

      await this.dataSource.query(
        `INSERT INTO video_chunks (
          video_transcript_id, chunk_index, text_preview, text_content, vector_id,
          start_seconds, end_seconds, token_count, is_active, embedding
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::vector)
        ON CONFLICT (vector_id) DO UPDATE SET
          video_transcript_id = EXCLUDED.video_transcript_id,
          chunk_index = EXCLUDED.chunk_index,
          text_preview = EXCLUDED.text_preview,
          text_content = EXCLUDED.text_content,
          start_seconds = EXCLUDED.start_seconds,
          end_seconds = EXCLUDED.end_seconds,
          token_count = EXCLUDED.token_count,
          is_active = EXCLUDED.is_active,
          embedding = EXCLUDED.embedding`,
        [
          chunk.videoTranscriptId,
          chunk.chunkIndex,
          chunk.text.slice(0, 300),
          chunk.text,
          vectorId,
          chunk.startSeconds,
          chunk.endSeconds,
          chunk.tokenCount,
          isActive,
          toVectorLiteral(vector),
        ],
      );
    }

    this.logger.log(
      `Upserted ${items.length} video chunk embeddings into Postgres`,
    );
  }

  /**
   * Reads full chunk texts by vector ID (mixed document + `video:`-prefixed
   * IDs), replacing ChromaDB's `collection.get({ ids })` used by exam
   * generation to gather grounded context.
   */
  async getChunkTexts(
    vectorIds: string[],
  ): Promise<Array<{ vectorId: string; text: string }>> {
    if (vectorIds.length === 0) {
      return [];
    }

    const documentRows = (await this.dataSource.query(
      `SELECT vector_id, COALESCE(text_content, text_preview) AS text
         FROM document_chunks
        WHERE vector_id = ANY($1)`,
      [vectorIds],
    )) as unknown as Array<{ vector_id: string; text: string | null }>;

    const videoRows = (await this.dataSource.query(
      `SELECT vector_id, COALESCE(text_content, text_preview) AS text
         FROM video_chunks
        WHERE vector_id = ANY($1)`,
      [vectorIds],
    )) as unknown as Array<{ vector_id: string; text: string | null }>;

    return [...documentRows, ...videoRows]
      .filter((row) => Boolean(row.text))
      .map((row) => ({ vectorId: row.vector_id, text: row.text as string }));
  }

  /**
   * Validates that all mandatory fields are present and defined.
   * Throws an explicit Error if any metadata field is missing.
   */
  private validateMetadata(fields: {
    courseId: string | null | undefined;
    documentId: string | null | undefined;
    version: number | null | undefined;
    chunkIndex: number | null | undefined;
    page: number | null | undefined;
  }): void {
    if (!fields.courseId || typeof fields.courseId !== 'string') {
      throw new Error(
        'Vector store metadata validation failed: courseId is required and must be a string',
      );
    }
    if (!fields.documentId || typeof fields.documentId !== 'string') {
      throw new Error(
        'Vector store metadata validation failed: documentId is required and must be a string',
      );
    }
    if (
      fields.version === undefined ||
      fields.version === null ||
      typeof fields.version !== 'number'
    ) {
      throw new Error(
        'Vector store metadata validation failed: version is required and must be a number',
      );
    }
    if (
      fields.chunkIndex === undefined ||
      fields.chunkIndex === null ||
      typeof fields.chunkIndex !== 'number'
    ) {
      throw new Error(
        'Vector store metadata validation failed: chunkIndex is required and must be a number',
      );
    }
    if (
      fields.page === undefined ||
      fields.page === null ||
      typeof fields.page !== 'number'
    ) {
      throw new Error(
        'Vector store metadata validation failed: page is required and must be a number',
      );
    }
  }
}
