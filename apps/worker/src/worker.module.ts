import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { IngestionProcessor } from './processors/ingestion.processor';
import { VideoIngestionProcessor } from './processors/video-ingestion.processor';
import { ExamGenerationProcessor } from './processors/exam-generation.processor';
import {
  EMBEDDING_PROVIDER,
  MockEmbeddingProvider,
  OpenAIEmbeddingProvider,
} from './adapters/embedding.adapter';
import {
  EXAM_LLM_PROVIDER,
  MockExamLlmProvider,
  OpenAIExamLlmProvider,
} from './adapters/exam-llm.adapter';
import { VectorStoreAdapter } from './adapters/vector-store.adapter';
import { DbNotificationProducer } from './adapters/db-notification.adapter';
import { BunnyCaptionsAdapter } from './adapters/captions/bunny-captions.adapter';
import { YoutubeCaptionsAdapter } from './adapters/captions/youtube-captions.adapter';
import { WhisperCaptionsAdapter } from './adapters/captions/whisper-captions.adapter';
import { NOTIFICATION_PRODUCER_PORT } from './common/ports/notification-producer.port';

/**
 * Local docker-compose Postgres has no SSL listener; only the deployed
 * Neon/Render database needs `ssl: true` (its own hostname is never localhost).
 */
const isLocalDatabaseUrl = /localhost|127\.0\.0\.1/.test(
  process.env.DATABASE_URL ?? '',
);

/**
 * Resolves the ioredis connection options for BullMQ. Prefers a full
 * `REDIS_URL` (the only form Render and other managed providers hand
 * out), falling back to the split `REDIS_HOST`/`REDIS_PORT` used locally.
 */
function redisConnection(config: ConfigService) {
  const url = config.get<string>('REDIS_URL');
  if (url) {
    const parsed = new URL(url);
    return {
      host: parsed.hostname,
      port: Number(parsed.port || 6379),
      username: parsed.username ? decodeURIComponent(parsed.username) : undefined,
      password: parsed.password ? decodeURIComponent(parsed.password) : undefined,
      tls: parsed.protocol === 'rediss:' ? {} : undefined,
    };
  }
  return {
    host: config.get<string>('REDIS_HOST', 'localhost'),
    port: config.get<number>('REDIS_PORT', 6379),
  };
}

/**
 * Root module for the standalone BullMQ worker application.
 *
 * Configures Redis connection, Postgres database connection via TypeORM,
 * Embedding & pgvector vector store adapters, and the IngestionProcessor worker.
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../../.env',
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres' as const,
        url: config.get<string>('DATABASE_URL'),
        entities: [],
        // The worker never mutates schema — migrations own it on every
        // environment (local docker-compose included).
        synchronize: false,
        ssl: isLocalDatabaseUrl ? false : true,
        extra: isLocalDatabaseUrl
          ? {}
          : {
              ssl: {
                rejectUnauthorized: false, // Allows connection to Neon/Render over safe TLS
              },
            },
      }),
    }),

    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: redisConnection(config),
      }),
    }),

    BullModule.registerQueue(
      { name: 'ingestion' },
      { name: 'video-ingestion' },
      { name: 'exam-generation' },
    ),
  ],
  providers: [
    IngestionProcessor,
    VideoIngestionProcessor,
    ExamGenerationProcessor,
    BunnyCaptionsAdapter,
    YoutubeCaptionsAdapter,
    WhisperCaptionsAdapter,
    VectorStoreAdapter,
    {
      provide: EMBEDDING_PROVIDER,
      useFactory: (configService: ConfigService) => {
        const apiKey =
          configService.get<string>('EMBEDDING_API_KEY') ||
          configService.get<string>('OPENAI_API_KEY');
        const env = configService.get<string>('NODE_ENV');

        // Use MockEmbeddingProvider for test/development when no valid API key is set
        if (!apiKey || apiKey === 'replace-me' || env === 'test') {
          return new MockEmbeddingProvider();
        }
        return new OpenAIEmbeddingProvider(configService);
      },
      inject: [ConfigService],
    },
    {
      provide: EXAM_LLM_PROVIDER,
      useFactory: (configService: ConfigService) => {
        const apiKey =
          configService.get<string>('OPENAI_API_KEY') ||
          configService.get<string>('LLM_API_KEY');
        const env = configService.get<string>('NODE_ENV');

        if (!apiKey || apiKey === 'replace-me' || env === 'test') {
          return new MockExamLlmProvider();
        }
        return new OpenAIExamLlmProvider(configService);
      },
      inject: [ConfigService],
    },
    {
      provide: NOTIFICATION_PRODUCER_PORT,
      useClass: DbNotificationProducer,
    },
  ],
})
export class WorkerModule {}
