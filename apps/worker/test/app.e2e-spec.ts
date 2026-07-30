/**
 * Worker e2e smoke test.
 *
 * The worker is a NestJS standalone application context (no HTTP server).
 * This test verifies that the module graph compiles and that the
 * IngestionProcessor is registered — without needing a live Redis or Postgres
 * connection (both are mocked).
 *
 * A full integration test (real Redis + Postgres, real PDF fixture) belongs in
 * a separate file once E-3/E-4 are implemented (sprint2-plan.md §3 E-5 note).
 */
import { Test, TestingModule } from '@nestjs/testing';
import { getDataSourceToken } from '@nestjs/typeorm';
import { getQueueToken } from '@nestjs/bullmq';
import { ConfigModule } from '@nestjs/config';
import { IngestionProcessor } from '../src/processors/ingestion.processor';

describe('WorkerModule (smoke)', () => {
  let moduleRef: TestingModule;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true })],
      providers: [
        IngestionProcessor,
        // Stub TypeORM DataSource — processor only uses it for raw SQL.
        {
          provide: getDataSourceToken(),
          useValue: { query: jest.fn().mockResolvedValue({ rowCount: 1 }) },
        },
        // Stub BullMQ queue — not needed for unit-level smoke.
        {
          provide: getQueueToken('ingestion'),
          useValue: { add: jest.fn() },
        },
      ],
    }).compile();
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  it('IngestionProcessor is resolvable', () => {
    const processor = moduleRef.get(IngestionProcessor);
    expect(processor).toBeDefined();
  });
});
