import { Injectable, Logger } from '@nestjs/common';

/**
 * Sprint 2 day-1 contract (sprint2-plan.md §2.1) — frozen shape so
 * Habsa's upload flow and Elgendy's BullMQ worker never need to change
 * in lockstep. `InMemoryJobQueue` below is the fake bound until the
 * real adapter (apps/api/src/modules/jobs/jobs.module.ts) lands.
 */
export const JOB_QUEUE_PORT = Symbol('JOB_QUEUE_PORT');

export interface JobQueuePort {
  enqueueDocumentIngestion(
    documentId: string,
    version: number,
  ): Promise<string>;
}

/**
 * Fake bound in DocumentsModule until Elgendy's real BullMQ-backed
 * adapter replaces it — a one-line swap in that module's providers.
 */
@Injectable()
export class InMemoryJobQueue implements JobQueuePort {
  private readonly logger = new Logger(InMemoryJobQueue.name);

  enqueueDocumentIngestion(
    documentId: string,
    version: number,
  ): Promise<string> {
    const jobId = `ingest:${documentId}:v${version}`;
    this.logger.log(`(fake) enqueued ${jobId}`);
    return Promise.resolve(jobId);
  }
}
