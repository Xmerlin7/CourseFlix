import { getDataSourceToken } from '@nestjs/typeorm';
import { Test } from '@nestjs/testing';
import { HealthService } from './health.service';

describe('HealthService', () => {
  let healthService: HealthService;
  let dataSource: { query: jest.Mock };

  beforeEach(async () => {
    dataSource = { query: jest.fn() };

    const moduleRef = await Test.createTestingModule({
      providers: [
        HealthService,
        { provide: getDataSourceToken(), useValue: dataSource },
      ],
    }).compile();

    healthService = moduleRef.get(HealthService);
  });

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
