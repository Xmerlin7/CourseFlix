import { Injectable } from '@nestjs/common';
import type { JobQueuePort } from '../../../common/ports/job-queue.port';
import { JobsService } from '../jobs.service';

/**
 * Real implementation of {@link JobQueuePort} backed by BullMQ + Postgres.
 *
 * Bound in {@link JobsModule} as the provider for {@link JOB_QUEUE_PORT},
 * replacing the day-1 {@link InMemoryJobQueue} fake (sprint2-plan.md §2.1).
 *
 * Delegates entirely to {@link JobsService#enqueueDocumentIngestion} which
 * owns the idempotency rule: BullMQ job ID = `ingest:${documentId}:v${version}`.
 */
@Injectable()
export class BullMqJobQueue implements JobQueuePort {
  constructor(private readonly jobsService: JobsService) {}

  enqueueDocumentIngestion(
    documentId: string,
    version: number,
  ): Promise<string> {
    return this.jobsService.enqueueDocumentIngestion(documentId, version);
  }
}
