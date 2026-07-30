import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { IngestionProcessor } from './processors/ingestion.processor';

/**
 * Root module for the standalone BullMQ worker application.
 *
 * Connects to the same Postgres instance as the API so the processor can
 * update `ai_jobs` rows directly via the TypeORM {@link DataSource}.
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres' as const,
        url: config.get<string>('DATABASE_URL'),
        // No entities needed here — the processor uses raw SQL via DataSource.
        entities: [],
        synchronize: false,
      }),
    }),

    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get<string>('REDIS_HOST'),
          port: config.get<number>('REDIS_PORT'),
        },
      }),
    }),

    BullModule.registerQueue({
      name: 'ingestion',
    }),
  ],
  providers: [IngestionProcessor],
})
export class WorkerModule {}