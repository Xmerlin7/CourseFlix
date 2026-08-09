import * as path from 'path';
import { IngestionProcessor, IngestionJobPayload } from './ingestion.processor';
import { MockEmbeddingProvider } from '../adapters/embedding.adapter';
import { Job } from 'bullmq';

describe('IngestionProcessor', () => {
  let processor: IngestionProcessor;
  let dataSource: { query: jest.Mock };
  let embeddingProvider: MockEmbeddingProvider;
  let vectorStoreAdapter: { upsertDocumentChunks: jest.Mock };
  let notificationProducer: { notify: jest.Mock };

  const samplePdfPath = path.resolve(
    __dirname,
    '../../test/fixtures/sample.pdf',
  );

  beforeEach(() => {
    dataSource = {
      query: jest.fn(),
    };

    embeddingProvider = new MockEmbeddingProvider();
    vectorStoreAdapter = {
      upsertDocumentChunks: jest.fn().mockResolvedValue(undefined),
    };
    notificationProducer = {
      notify: jest.fn().mockResolvedValue(undefined),
    };

    processor = new IngestionProcessor(
      dataSource as unknown as import('typeorm').DataSource,
      embeddingProvider,
      vectorStoreAdapter as unknown as import('../adapters/vector-store.adapter').VectorStoreAdapter,
      notificationProducer,
    );
  });

  it('processes ingestion job through extract -> chunk -> embed -> vector store upsert -> complete', async () => {
    // Mock claim UPDATE returning one row and SQL queries
    dataSource.query.mockImplementation((sql: string) => {
      if (
        sql.includes('UPDATE ai_jobs') &&
        sql.includes("SET status = 'processing'")
      ) {
        return Promise.resolve([{ id: 'ai-job-uuid-1' }]);
      }
      if (
        sql.includes('SELECT target_entity_type, target_entity_id FROM ai_jobs')
      ) {
        return Promise.resolve([
          { target_entity_type: 'document', target_entity_id: 'doc-uuid-1' },
        ]);
      }
      if (
        sql.includes(
          'SELECT id, course_id, uploaded_by, file_id, file_name, version FROM documents',
        )
      ) {
        return Promise.resolve([
          {
            id: 'doc-uuid-1',
            course_id: 'course-uuid-1',
            uploaded_by: 'teacher-uuid-1',
            file_id: 'file-uuid-1',
            file_name: 'sample.pdf',
            version: 1,
          },
        ]);
      }
      if (
        sql.includes('SELECT id, storage_path, storage_provider FROM files')
      ) {
        return Promise.resolve([
          {
            id: 'file-uuid-1',
            storage_path: samplePdfPath,
            storage_provider: 'local',
          },
        ]);
      }
      return Promise.resolve({ rowCount: 1 });
    });

    const job = {
      id: 'bull-job-1',
      data: { jobId: 'ai-job-uuid-1' },
    } as Job<IngestionJobPayload>;

    await processor.process(job);

    expect(vectorStoreAdapter.upsertDocumentChunks).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          courseId: 'course-uuid-1',
          isActive: true,
        }),
      ]),
    );

    // Verify completion status updates
    expect(dataSource.query).toHaveBeenCalledWith(
      expect.stringContaining("UPDATE ai_jobs SET status = 'completed'"),
      expect.any(Array),
    );
    expect(dataSource.query).toHaveBeenCalledWith(
      expect.stringContaining(
        "UPDATE documents SET processing_status = 'completed'",
      ),
      expect.any(Array),
    );

    // Verify teacher completion notification
    expect(notificationProducer.notify).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'teacher-uuid-1',
        type: 'document_ingestion_completed',
      }),
    );
  });

  it('handles pipeline failure: sets failed status, deactivates partial chunks, notifies teacher, and re-throws error', async () => {
    // Inject failure at embed stage
    jest
      .spyOn(embeddingProvider, 'embed')
      .mockRejectedValueOnce(
        new Error('Embedding provider connection timeout'),
      );

    dataSource.query.mockImplementation((sql: string) => {
      if (
        sql.includes('UPDATE ai_jobs') &&
        sql.includes("SET status = 'processing'")
      ) {
        return Promise.resolve([{ id: 'ai-job-uuid-1' }]);
      }
      if (
        sql.includes('SELECT target_entity_type, target_entity_id FROM ai_jobs')
      ) {
        return Promise.resolve([
          { target_entity_type: 'document', target_entity_id: 'doc-uuid-1' },
        ]);
      }
      if (
        sql.includes(
          'SELECT id, course_id, uploaded_by, file_id, file_name, version FROM documents',
        )
      ) {
        return Promise.resolve([
          {
            id: 'doc-uuid-1',
            course_id: 'course-uuid-1',
            uploaded_by: 'teacher-uuid-1',
            file_id: 'file-uuid-1',
            file_name: 'sample.pdf',
            version: 1,
          },
        ]);
      }
      if (
        sql.includes('SELECT id, storage_path, storage_provider FROM files')
      ) {
        return Promise.resolve([
          {
            id: 'file-uuid-1',
            storage_path: samplePdfPath,
            storage_provider: 'local',
          },
        ]);
      }
      return Promise.resolve({ rowCount: 1 });
    });

    const job = {
      id: 'bull-job-1',
      data: { jobId: 'ai-job-uuid-1' },
    } as Job<IngestionJobPayload>;

    await expect(processor.process(job)).rejects.toThrow(
      'Embedding provider connection timeout',
    );

    // Verify ai_jobs status set to failed
    expect(dataSource.query).toHaveBeenCalledWith(
      expect.stringContaining(
        "UPDATE ai_jobs\n          SET status = 'failed'",
      ),
      expect.arrayContaining([
        'ai-job-uuid-1',
        'Embedding provider connection timeout',
      ]),
    );

    // Verify documents status set to failed
    expect(dataSource.query).toHaveBeenCalledWith(
      expect.stringContaining(
        "UPDATE documents SET processing_status = 'failed'",
      ),
      expect.arrayContaining([
        'doc-uuid-1',
        'Embedding provider connection timeout',
      ]),
    );

    // Verify partial chunks deactivated
    expect(dataSource.query).toHaveBeenCalledWith(
      expect.stringContaining(
        'UPDATE document_chunks\n          SET is_active = false',
      ),
      ['doc-uuid-1'],
    );

    // Verify teacher failure notification
    expect(notificationProducer.notify).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'teacher-uuid-1',
        type: 'document_ingestion_failed',
      }),
    );
  });

  it('retries a failed job: succeeds cleanly without creating duplicated chunks or vector records', async () => {
    // 1. Initial attempt fails at embed stage
    jest
      .spyOn(embeddingProvider, 'embed')
      .mockRejectedValueOnce(new Error('Transient embedding failure'))
      .mockResolvedValueOnce([
        [0.1, 0.2, 0.3],
        [0.4, 0.5, 0.6],
      ]);

    dataSource.query.mockImplementation((sql: string) => {
      if (
        sql.includes('UPDATE ai_jobs') &&
        sql.includes("SET status = 'processing'")
      ) {
        return Promise.resolve([{ id: 'ai-job-uuid-1' }]);
      }
      if (
        sql.includes('SELECT target_entity_type, target_entity_id FROM ai_jobs')
      ) {
        return Promise.resolve([
          { target_entity_type: 'document', target_entity_id: 'doc-uuid-1' },
        ]);
      }
      if (
        sql.includes(
          'SELECT id, course_id, uploaded_by, file_id, file_name, version FROM documents',
        )
      ) {
        return Promise.resolve([
          {
            id: 'doc-uuid-1',
            course_id: 'course-uuid-1',
            uploaded_by: 'teacher-uuid-1',
            file_id: 'file-uuid-1',
            file_name: 'sample.pdf',
            version: 1,
          },
        ]);
      }
      if (
        sql.includes('SELECT id, storage_path, storage_provider FROM files')
      ) {
        return Promise.resolve([
          {
            id: 'file-uuid-1',
            storage_path: samplePdfPath,
            storage_provider: 'local',
          },
        ]);
      }
      return Promise.resolve({ rowCount: 1 });
    });

    const job = {
      id: 'bull-job-1',
      data: { jobId: 'ai-job-uuid-1' },
    } as Job<IngestionJobPayload>;

    // Attempt 1: Fails
    await expect(processor.process(job)).rejects.toThrow(
      'Transient embedding failure',
    );

    // Attempt 2: Retry succeeds
    await processor.process(job);

    // Assert ai_jobs set to completed on retry
    expect(dataSource.query).toHaveBeenCalledWith(
      expect.stringContaining("UPDATE ai_jobs SET status = 'completed'"),
      expect.any(Array),
    );

    // Assert vector store upsert invoked with single set of chunks
    expect(vectorStoreAdapter.upsertDocumentChunks).toHaveBeenCalledTimes(1);
  });
});
