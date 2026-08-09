/**
 * Worker e2e smoke test.
 *
 * Verifies that the module graph compiles and that the IngestionProcessor is resolvable.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { getDataSourceToken } from '@nestjs/typeorm';
import { getQueueToken } from '@nestjs/bullmq';
import { ConfigModule } from '@nestjs/config';
import { IngestionProcessor } from '../src/processors/ingestion.processor';
import { EMBEDDING_PROVIDER, MockEmbeddingProvider } from '../src/adapters/embedding.adapter';
import { VectorStoreAdapter } from '../src/adapters/vector-store.adapter';
import { NOTIFICATION_PRODUCER_PORT, NoopNotificationProducer } from '../../api/src/common/ports/notification-producer.port';

describe('WorkerModule (smoke)', () => {
  let moduleRef: TestingModule;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true })],
      providers: [
        IngestionProcessor,
        {
          provide: getDataSourceToken(),
          useValue: { query: jest.fn().mockResolvedValue({ rowCount: 1 }) },
        },
        {
          provide: getQueueToken('ingestion'),
          useValue: { add: jest.fn() },
        },
        {
          provide: EMBEDDING_PROVIDER,
          useClass: MockEmbeddingProvider,
        },
        {
          provide: VectorStoreAdapter,
          useValue: { upsertDocumentChunks: jest.fn() },
        },
        {
          provide: NOTIFICATION_PRODUCER_PORT,
          useClass: NoopNotificationProducer,
        },
      ],
    }).compile();
  });

  afterAll(async () => {
    if (moduleRef) {
      await moduleRef.close();
    }
  });

  it('IngestionProcessor is resolvable', () => {
    const processor = moduleRef.get(IngestionProcessor);
    expect(processor).toBeDefined();
  });
});
