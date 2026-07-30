import { Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { DataSource } from 'typeorm';

/**
 * Payload shape placed on the 'ingestion' queue by
 * {@link JobsService#enqueueDocumentIngestion} in the API workspace.
 */
export interface IngestionJobPayload {
  /** UUID of the `ai_jobs` row created in the API. */
  jobId: string;
}

/**
 * BullMQ worker that processes PDF ingestion jobs from the 'ingestion' queue.
 *
 * Current implementation (E-2 scaffold):
 *   claim → runStages → markCompleted  (or markFailed on any throw)
 *
 * E-3 / E-4 will fill in {@link runStages} with real extract → chunk →
 * embed → upsert → persist document_chunks logic.
 */
@Processor('ingestion')
export class IngestionProcessor extends WorkerHost {
  private readonly logger = new Logger(IngestionProcessor.name);

  constructor(private readonly dataSource: DataSource) {
    super();
  }

  async process(job: Job<IngestionJobPayload>): Promise<void> {
    const { jobId } = job.data;
    this.logger.log(`[${job.id}] picked up ai_jobs row ${jobId}`);

    // Atomic claim — skip if another worker already owns this row or it
    // was completed by a previous attempt.
    const claimed = await this.claim(jobId);
    if (!claimed) {
      this.logger.warn(
        `[${job.id}] ai_jobs row ${jobId} already claimed or completed — skipping`,
      );
      return;
    }

    try {
      await this.runStages(jobId);
      await this.markCompleted(jobId);
      this.logger.log(`[${job.id}] ai_jobs row ${jobId} → completed`);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : String(err);
      await this.markFailed(jobId, message);
      this.logger.error(
        `[${job.id}] ai_jobs row ${jobId} → failed: ${message}`,
      );
      // Re-throw so BullMQ honours the `attempts` / `backoff` config
      // set by JobsService and keeps the job retryable.
      throw err;
    }
  }

  // ---------------------------------------------------------------------------
  // Stage runner — E-3/E-4 will replace this stub.
  // ---------------------------------------------------------------------------

  /**
   * Stub placeholder for the full extract → chunk → embed → upsert pipeline.
   * Replace the body once E-3 (extract.stage.ts, chunk.stage.ts) and E-4
   * (embedding.adapter.ts, chroma.adapter.ts) are implemented.
   */
  private async runStages(jobId: string): Promise<void> {
    this.logger.log(
      `[runStages] jobId=${jobId} — pipeline stub (E-3/E-4 pending)`,
    );
    // TODO(E-3): const pages = await extractStage.run(document);
    // TODO(E-3): const chunks = await chunkStage.run(pages, document);
    // TODO(E-4): const vectors = await embeddingAdapter.embed(chunks);
    // TODO(E-4): await chromaAdapter.upsert(vectors);
    // TODO(E-4): persist document_chunks rows, set document.processing_status
  }

  // ---------------------------------------------------------------------------
  // ai_jobs status helpers — direct SQL via DataSource so the worker needs no
  // dependency on the API's JobsService class at runtime.
  // ---------------------------------------------------------------------------

  /**
   * Atomically transitions a job from 'queued' to 'processing'.
   * Returns false if the row is already completed (or missing), meaning
   * another worker claimed it first — caller should skip.
   */
  private async claim(jobId: string): Promise<boolean> {
    const result = await this.dataSource.query(
      `UPDATE ai_jobs
          SET status = 'processing', started_at = NOW()
        WHERE id = $1
          AND status != 'completed'`,
      [jobId],
    );
    // pg driver returns rowCount on UPDATE
    return (result?.rowCount ?? 0) > 0;
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
}
