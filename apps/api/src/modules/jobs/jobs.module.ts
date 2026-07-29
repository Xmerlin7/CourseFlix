import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiJobEntity } from './entities/ai_jobs.entity';
import { DocumentChunkEntity } from './entities/document-chunk.entity';
import { JobsService } from './jobs.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AiJobEntity,
      DocumentChunkEntity,
    ]),
  ],
  providers: [JobsService],
  exports: [JobsService],
})
export class JobsModule {}