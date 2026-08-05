import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { RetrievedChunk } from '../../../common/ports/retrieval.port';

@Injectable()
export class AnswerPolicyService {
  constructor(private readonly configService: ConfigService) {}

  getRelevantChunks(chunks: RetrievedChunk[]): RetrievedChunk[] {
    const maxDistance = Number(
      this.configService.get<string>('TUTOR_MAX_DISTANCE') ?? 1.35,
    );

    return chunks.filter((chunk) => Number(chunk.score) <= maxDistance);
  }
}
