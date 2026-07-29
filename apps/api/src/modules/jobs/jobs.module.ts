import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { AiJobEntity } from './entities/ai_jobs.entity';
import { DocumentChunkEntity } from './entities/document-chunk.entity';
import { JobsService } from './jobs.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AiJobEntity,
      DocumentChunkEntity,
    ]),
    BullModule.registerQueue({
      name: 'ingestion',
    }),
  ],
  providers: [JobsService],
  exports: [JobsService],
})
export class JobsModule {}