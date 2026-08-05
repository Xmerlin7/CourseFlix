import { Inject, Injectable, Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { DataSource } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';

import { extractPdfPages, ExtractedPage } from '../stages/extract.stage';
import { chunkDocument, DocumentChunk } from '../stages/chunk.stage';
import type { EmbeddingProvider } from '../adapters/embedding.adapter';
import { EMBEDDING_PROVIDER } from '../adapters/embedding.adapter';
import { ChromaAdapter } from '../adapters/chroma.adapter';
import type { NotificationProducerPort } from '../common/ports/notification-producer.port';
import { NOTIFICATION_PRODUCER_PORT } from '../common/ports/notification-producer.port';

export interface IngestionJobPayload {
  /** UUID of the `ai_jobs` row created in the API. */
  jobId: string;
}

interface DocumentRecord {
  id: string;
  course_id: string;
  uploaded_by: string;
  file_id: string;
  file_name: string;
  version: number;
}

interface FileRecord {
  id: string;
  storage_path: string;
  storage_provider: string;
}

interface JobRecord {
  target_entity_type: string;
  target_entity_id: string;
}

/**
 * BullMQ worker processor executing full PDF ingestion pipeline:
 * Extract → Chunk → Embed → Chroma Upsert → Persist document_chunks → Complete & Notify.
 *
 * Implements strict stage separation and failure contracts per Sprint 2 §E-4.
 */
@Processor('ingestion')
@Injectable()
export class IngestionProcessor extends WorkerHost {
  private readonly logger = new Logger(IngestionProcessor.name);

  constructor(
    private readonly dataSource: DataSource,
    @Inject(EMBEDDING_PROVIDER)
    private readonly embeddingProvider: EmbeddingProvider,
    private readonly chromaAdapter: ChromaAdapter,
    @Inject(NOTIFICATION_PRODUCER_PORT)
    private readonly notificationProducer: NotificationProducerPort,
  ) {
    super();
  }

  async process(job: Job<IngestionJobPayload>): Promise<void> {
    const { jobId } = job.data;
    this.logger.log(`[${job.id}] picked up ai_jobs row ${jobId}`);

    const claimed = await this.claim(jobId);
    if (!claimed) {
      this.logger.warn(
        `[${job.id}] ai_jobs row ${jobId} already claimed or completed — skipping`,
      );
      return;
    }

    let documentId: string | null = null;
    let teacherId: string | null = null;
    let fileName: string | null = null;

    try {
      const jobRecord = await this.getJobRecord(jobId);
      if (!jobRecord || jobRecord.target_entity_type !== 'document') {
        throw new Error(`Invalid job target entity for ai_jobs row ${jobId}`);
      }

      documentId = jobRecord.target_entity_id;
      const docRecord = await this.getDocumentRecord(documentId);
      if (!docRecord) {
        throw new Error(`Document not found for ID ${documentId}`);
      }

      teacherId = docRecord.uploaded_by;
      fileName = docRecord.file_name;

      await this.markDocumentProcessing(documentId);

      await this.runStages(docRecord);

      await this.markCompleted(jobId);
      await this.markDocumentCompleted(documentId);

      // Notify teacher of completion
      await this.notificationProducer.notify({
        userId: teacherId,
        type: 'document_ingestion_completed',
        title: 'تم معالجة المستند بنجاح',
        message: `تم استخراج ومعالجة ملف "${fileName}" وإضافته للمساعد الذكي.`,
        relatedEntityType: 'document',
        relatedEntityId: documentId,
      });

      this.logger.log(
        `[${job.id}] ai_jobs row ${jobId} (doc ${documentId}) → completed`,
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(
        `[${job.id}] ai_jobs row ${jobId} → failed: ${message}`,
      );

      await this.markFailed(jobId, message);

      if (documentId) {
        await this.markDocumentFailed(documentId, message);
        await this.deactivatePartialChunks(documentId);

        if (teacherId && fileName) {
          await this.notificationProducer.notify({
            userId: teacherId,
            type: 'document_ingestion_failed',
            title: 'فشلت معالجة المستند',
            message: `تعذر معالجة ملف "${fileName}": ${message}`,
            relatedEntityType: 'document',
            relatedEntityId: documentId,
          });
        }
      }

      // Re-throw so BullMQ handles attempts & exponential backoff
      throw err;
    }
  }

  /**
   * Pipeline stages:
   * 1. Read PDF file buffer from storage
   * 2. Extract per-page text (extractPdfPages)
   * 3. Chunk text into deterministic windows (chunkDocument)
   * 4. Generate embeddings (embeddingProvider.embed)
   * 5. Upsert vectors to ChromaDB (chromaAdapter.upsert)
   * 6. Persist document_chunks rows to Postgres
   * 7. Deactivate older version chunks in Postgres
   */
  private async runStages(doc: DocumentRecord): Promise<void> {
    const fileRecord = await this.getFileRecord(doc.file_id);
    if (!fileRecord) {
      throw new Error(`File record not found for file ID ${doc.file_id}`);
    }

    const pdfBuffer = await this.readStorageFile(fileRecord.storage_path);

    // Stage 1: Extract
    const pages: ExtractedPage[] = await extractPdfPages(pdfBuffer);

    // Stage 2: Chunk
    const chunks: DocumentChunk[] = chunkDocument({
      documentId: doc.id,
      version: doc.version,
      pages,
    });

    if (chunks.length === 0) {
      throw new Error('Document produced zero chunks after processing');
    }

    // Stage 3: Embed
    const texts = chunks.map((c) => c.text);
    const vectors = await this.embeddingProvider.embed(texts);

    if (vectors.length !== chunks.length) {
      throw new Error(
        `Embedding count mismatch: expected ${chunks.length}, got ${vectors.length}`,
      );
    }

    // Stage 4: Chroma Upsert
    const upsertInputs = chunks.map((chunk, index) => ({
      chunk,
      courseId: doc.course_id,
      vector: vectors[index],
      isActive: true,
    }));

    await this.chromaAdapter.upsert(upsertInputs);

    // Stage 5: Persist Postgres document_chunks
    await this.persistDocumentChunks(doc.id, chunks);

    // Stage 6: Deactivate superseded versions in Postgres
    if (doc.version > 1) {
      await this.deactivateSupersededVersions(doc.id, doc.version);
    }
  }

  private async readStorageFile(storagePath: string): Promise<Buffer> {
    const resolvedPath = path.isAbsolute(storagePath)
      ? storagePath
      : path.resolve(process.cwd(), storagePath);

    if (!fs.existsSync(resolvedPath)) {
      throw new Error(`Storage file not found at path: ${resolvedPath}`);
    }

    return fs.promises.readFile(resolvedPath);
  }

  private async persistDocumentChunks(
    documentId: string,
    chunks: DocumentChunk[],
  ): Promise<void> {
    for (const chunk of chunks) {
      const textPreview = chunk.text.slice(0, 300);
      const vectorId = `${documentId}:${chunk.version}:${chunk.chunkIndex}`;

      await this.dataSource.query(
        `INSERT INTO document_chunks (
          document_id, chunk_index, text_preview, vector_id, page_number, token_count, is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, true)`,
        [
          documentId,
          chunk.chunkIndex,
          textPreview,
          vectorId,
          chunk.page,
          chunk.tokenCount,
        ],
      );
    }
  }

  private async deactivateSupersededVersions(
    documentId: string,
    currentVersion: number,
  ): Promise<void> {
    await this.dataSource.query(
      `UPDATE document_chunks
          SET is_active = false
        WHERE document_id = $1
          AND vector_id NOT LIKE $2`,
      [documentId, `${documentId}:${currentVersion}:%`],
    );
  }

  private async deactivatePartialChunks(documentId: string): Promise<void> {
    await this.dataSource.query(
      `UPDATE document_chunks
          SET is_active = false
        WHERE document_id = $1`,
      [documentId],
    );
  }

  // ---------------------------------------------------------------------------
  // SQL Helpers
  // ---------------------------------------------------------------------------

  private async claim(jobId: string): Promise<boolean> {
    const rows = (await this.dataSource.query(
      `UPDATE ai_jobs
          SET status = 'processing', started_at = NOW()
        WHERE id = $1
          AND status IN ('queued', 'failed')
        RETURNING id`,
      [jobId],
    )) as unknown as Array<{ id: string }>;
    return rows.length > 0;
  }

  private async getJobRecord(jobId: string): Promise<JobRecord | null> {
    const rows = (await this.dataSource.query(
      `SELECT target_entity_type, target_entity_id FROM ai_jobs WHERE id = $1`,
      [jobId],
    )) as unknown as JobRecord[];
    return rows[0] || null;
  }

  private async getDocumentRecord(
    documentId: string,
  ): Promise<DocumentRecord | null> {
    const rows = (await this.dataSource.query(
      `SELECT id, course_id, uploaded_by, file_id, file_name, version FROM documents WHERE id = $1`,
      [documentId],
    )) as unknown as DocumentRecord[];
    return rows[0] || null;
  }

  private async getFileRecord(fileId: string): Promise<FileRecord | null> {
    const rows = (await this.dataSource.query(
      `SELECT id, storage_path, storage_provider FROM files WHERE id = $1`,
      [fileId],
    )) as unknown as FileRecord[];
    return rows[0] || null;
  }

  private async markCompleted(jobId: string): Promise<void> {
    await this.dataSource.query(
      `UPDATE ai_jobs SET status = 'completed', finished_at = NOW() WHERE id = $1`,
      [jobId],
    );
  }

  private async markFailed(jobId: string, errorMessage: string): Promise<void> {
    await this.dataSource.query(
      `UPDATE ai_jobs
          SET status = 'failed',
              finished_at = NOW(),
              error_message = $2,
              retries = retries + 1
        WHERE id = $1`,
      [jobId, errorMessage],
    );
  }

  private async markDocumentProcessing(documentId: string): Promise<void> {
    await this.dataSource.query(
      `UPDATE documents SET processing_status = 'processing' WHERE id = $1`,
      [documentId],
    );
  }

  private async markDocumentCompleted(documentId: string): Promise<void> {
    await this.dataSource.query(
      `UPDATE documents SET processing_status = 'completed', error_message = NULL WHERE id = $1`,
      [documentId],
    );
  }

  private async markDocumentFailed(
    documentId: string,
    errorMessage: string,
  ): Promise<void> {
    await this.dataSource.query(
      `UPDATE documents SET processing_status = 'failed', error_message = $2 WHERE id = $1`,
      [documentId, errorMessage],
    );
  }
}
