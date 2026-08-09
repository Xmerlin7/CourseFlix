import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectDataSource } from '@nestjs/typeorm';
import { InjectQueue } from '@nestjs/bullmq';
import { DataSource } from 'typeorm';
import { Queue } from 'bullmq';

export interface HealthResponse {
  api: 'ok';
  database: 'ok' | 'error';
  timestamp: string;
}

export type DependencyStatus = 'ok' | 'error';

export interface LivenessResponse {
  status: 'ok';
  timestamp: string;
}

export interface ReadinessResponse {
  status: 'ok' | 'degraded';
  timestamp: string;
  dependencies: {
    api: DependencyStatus;
    database: DependencyStatus;
    redis: DependencyStatus;
    vectorStore: DependencyStatus;
    aiProvider: DependencyStatus;
  };
}

@Injectable()
export class HealthService {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    @InjectQueue('ingestion') private readonly ingestionQueue: Queue,
    private readonly configService: ConfigService,
  ) {}

  async getHealth(): Promise<HealthResponse> {
    return {
      api: 'ok',
      database: await this.checkDatabase(),
      timestamp: new Date().toISOString(),
    };
  }

  // Liveness: only answers "is the process up". No dependency calls — a
  // slow/unreachable Redis must never fail liveness, or an orchestrator
  // would kill a perfectly healthy process for a problem a restart can't fix.
  getLiveness(): LivenessResponse {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  // Readiness: checks every dependency Sprint 3 modules rely on. Never
  // throws — a failing dependency is reported as 'error' in the payload,
  // never as a raw connection string, host, or stack trace.
  async getReadiness(): Promise<ReadinessResponse> {
    const [database, redis, vectorStore] = await Promise.all([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkVectorStore(),
    ]);
    const aiProvider = this.checkAiProviderConfigured();

    const dependencies = {
      api: 'ok' as const,
      database,
      redis,
      vectorStore,
      aiProvider,
    };

    const status = Object.values(dependencies).every((d) => d === 'ok')
      ? 'ok'
      : 'degraded';

    return { status, timestamp: new Date().toISOString(), dependencies };
  }

  private async checkDatabase(): Promise<DependencyStatus> {
    try {
      await this.dataSource.query('SELECT 1');
      return 'ok';
    } catch {
      return 'error';
    }
  }

  private async checkRedis(): Promise<DependencyStatus> {
    try {
      const client = await this.ingestionQueue.client;
      await client.info();
      return 'ok';
    } catch {
      return 'error';
    }
  }

  private async checkVectorStore(): Promise<DependencyStatus> {
    try {
      // pgvector extension present means chunk embeddings can be searched.
      const rows = (await this.dataSource.query(
        `SELECT 1 FROM pg_extension WHERE extname = 'vector'`,
      )) as unknown as Array<unknown>;
      return rows.length > 0 ? 'ok' : 'error';
    } catch {
      return 'error';
    }
  }

  // "Configured", not "reachable" — a live call against a paid
  // embedding/LLM API on every readiness poll would be wasteful. Confirms
  // the key is present and isn't still the .env.example placeholder.
  private checkAiProviderConfigured(): DependencyStatus {
    const key =
      this.configService.get<string>('OPENAI_API_KEY') ||
      this.configService.get<string>('EMBEDDING_API_KEY');
    return key && key !== 'replace-me' ? 'ok' : 'error';
  }
}
