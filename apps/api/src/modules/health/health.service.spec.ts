import { getDataSourceToken } from '@nestjs/typeorm';
import { getQueueToken } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { HealthService } from './health.service';

const mockHeartbeat = jest.fn();
jest.mock('chromadb', () => ({
  ChromaClient: jest.fn().mockImplementation(() => ({
    heartbeat: mockHeartbeat,
  })),
}));

describe('HealthService', () => {
  let healthService: HealthService;
  let dataSource: { query: jest.Mock };
  let mockRedisInfo: jest.Mock;
  let ingestionQueue: { client: Promise<{ info: jest.Mock }> };
  let configService: { get: jest.Mock };

  beforeEach(async () => {
    dataSource = { query: jest.fn() };
    mockRedisInfo = jest.fn().mockResolvedValue('redis_version:7.0.0');
    ingestionQueue = {
      client: Promise.resolve({ info: mockRedisInfo }),
    };
    configService = {
      get: jest.fn((key: string) => {
        if (key === 'CHROMA_URL') return 'http://localhost:8000';
        if (key === 'EMBEDDING_API_KEY') return 'valid-api-key';
        return undefined;
      }),
    };
    mockHeartbeat.mockResolvedValue(1000);

    const moduleRef = await Test.createTestingModule({
      providers: [
        HealthService,
        { provide: getDataSourceToken(), useValue: dataSource },
        { provide: getQueueToken('ingestion'), useValue: ingestionQueue },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    healthService = moduleRef.get(HealthService);
  });

  describe('getHealth', () => {
    it('reports database ok when the connectivity check succeeds', async () => {
      dataSource.query.mockResolvedValue([{ '?column?': 1 }]);

      const result = await healthService.getHealth();

      expect(result.api).toBe('ok');
      expect(result.database).toBe('ok');
      expect(typeof result.timestamp).toBe('string');
    });

    it('reports database error without leaking the underlying error', async () => {
      dataSource.query.mockRejectedValue(
        new Error('connection refused at 10.0.0.5:5432'),
      );

      const result = await healthService.getHealth();

      expect(result.api).toBe('ok');
      expect(result.database).toBe('error');
      expect(JSON.stringify(result)).not.toContain('10.0.0.5');
    });
  });

  describe('getLiveness', () => {
    it('returns status ok without checking any external dependencies', () => {
      const result = healthService.getLiveness();

      expect(result.status).toBe('ok');
      expect(typeof result.timestamp).toBe('string');
      expect(dataSource.query).not.toHaveBeenCalled();
      expect(mockRedisInfo).not.toHaveBeenCalled();
      expect(mockHeartbeat).not.toHaveBeenCalled();
    });
  });

  describe('getReadiness', () => {
    it('returns status ok when all dependency checks pass', async () => {
      dataSource.query.mockResolvedValue([{ '?column?': 1 }]);

      const result = await healthService.getReadiness();

      expect(result.status).toBe('ok');
      expect(typeof result.timestamp).toBe('string');
      expect(result.dependencies).toEqual({
        api: 'ok',
        database: 'ok',
        redis: 'ok',
        chroma: 'ok',
        aiProvider: 'ok',
      });
    });

    it('returns status degraded when database check fails', async () => {
      dataSource.query.mockRejectedValue(new Error('DB Connection Error'));

      const result = await healthService.getReadiness();

      expect(result.status).toBe('degraded');
      expect(result.dependencies.database).toBe('error');
      expect(result.dependencies.redis).toBe('ok');
      expect(result.dependencies.chroma).toBe('ok');
      expect(result.dependencies.aiProvider).toBe('ok');
    });

    it('returns status degraded when redis check fails', async () => {
      dataSource.query.mockResolvedValue([{ '?column?': 1 }]);
      mockRedisInfo.mockRejectedValue(new Error('Redis connection refused'));

      const result = await healthService.getReadiness();

      expect(result.status).toBe('degraded');
      expect(result.dependencies.redis).toBe('error');
      expect(result.dependencies.database).toBe('ok');
    });

    it('returns status degraded when chroma check fails', async () => {
      dataSource.query.mockResolvedValue([{ '?column?': 1 }]);
      mockHeartbeat.mockRejectedValue(new Error('Chroma down'));

      const result = await healthService.getReadiness();

      expect(result.status).toBe('degraded');
      expect(result.dependencies.chroma).toBe('error');
    });
  });

  describe('checkAiProviderConfigured', () => {
    it('returns error when EMBEDDING_API_KEY is missing', async () => {
      dataSource.query.mockResolvedValue([{ '?column?': 1 }]);
      configService.get.mockImplementation((key: string) => {
        if (key === 'CHROMA_URL') return 'http://localhost:8000';
        if (key === 'EMBEDDING_API_KEY') return undefined;
        return undefined;
      });

      const result = await healthService.getReadiness();

      expect(result.status).toBe('degraded');
      expect(result.dependencies.aiProvider).toBe('error');
    });

    it('returns error when EMBEDDING_API_KEY is placeholder replace-me', async () => {
      dataSource.query.mockResolvedValue([{ '?column?': 1 }]);
      configService.get.mockImplementation((key: string) => {
        if (key === 'CHROMA_URL') return 'http://localhost:8000';
        if (key === 'EMBEDDING_API_KEY') return 'replace-me';
        return undefined;
      });

      const result = await healthService.getReadiness();

      expect(result.status).toBe('degraded');
      expect(result.dependencies.aiProvider).toBe('error');
    });
  });
});
