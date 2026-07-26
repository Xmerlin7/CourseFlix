import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

export interface HealthResponse {
  api: 'ok';
  database: 'ok' | 'error';
  timestamp: string;
}

@Injectable()
export class HealthService {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async getHealth(): Promise<HealthResponse> {
    return {
      api: 'ok',
      database: await this.checkDatabase(),
      timestamp: new Date().toISOString(),
    };
  }

  // Never surface the underlying error (connection string, host, stack
  // trace) — only ever "ok" or "error", per CF-TASK-024's "no secrets,
  // paths, or env values" rule.
  private async checkDatabase(): Promise<'ok' | 'error'> {
    try {
      await this.dataSource.query('SELECT 1');
      return 'ok';
    } catch {
      return 'error';
    }
  }
}
