import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Repository } from 'typeorm';
import { AiJobEntity } from './entities/ai_jobs.entity';
import { DocumentChunkEntity } from './entities/document-chunk.entity';

@Injectable()
export class JobsService {
    constructor(
        @InjectRepository(AiJobEntity)
        private readonly aiJobsRepository: Repository<AiJobEntity>,

        @InjectRepository(DocumentChunkEntity)
        private readonly documentChunksRepository: Repository<DocumentChunkEntity>,

        @InjectQueue('ingestion')
        private readonly ingestionQueue: Queue,
    ) { }

    async createJob(
        jobType: string,
        targetEntityType: string,
        targetEntityId: string,
    ): Promise<AiJobEntity> {
        const job = this.aiJobsRepository.create({
            jobType,
            targetEntityType,
            targetEntityId,
        });

        const savedJob = await this.aiJobsRepository.save(job);

        await this.ingestionQueue.add(
            'ingestion',
            {
                jobId: savedJob.id,
            },
        );

        return savedJob;
    }

    private async updateJob(
        jobId: string,
        data: Partial<AiJobEntity>,
    ): Promise<void> {
        await this.aiJobsRepository.update(jobId, data);
    }

    async markProcessing(jobId: string): Promise<void> {
        await this.updateJob(jobId, {
            status: 'processing',
            startedAt: new Date(),
        });
    }


    async markCompleted(jobId: string): Promise<void> {
        await this.updateJob(jobId, {
            status: 'completed',
            finishedAt: new Date(),
        });
    }

    async markFailed(
        jobId: string,
        errorMessage: string,
    ): Promise<void> {
        await this.updateJob(jobId, {
            status: 'failed',
            finishedAt: new Date(),
            errorMessage,
        });
    }
}