import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RETRIEVAL_PORT } from '../../common/ports/retrieval.port';
import { RetrievalService } from './retrieval.service';
import {
  EMBEDDING_PROVIDER,
  MockEmbeddingProvider,
  OpenAIEmbeddingProvider,
} from '../../../../worker/src/adapters/embedding.adapter';

@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature([])],
  providers: [
    RetrievalService,
    {
      provide: RETRIEVAL_PORT,
      useExisting: RetrievalService,
    },
    {
      provide: EMBEDDING_PROVIDER,
      useFactory: (configService: ConfigService) => {
        const apiKey = configService.get<string>('EMBEDDING_API_KEY');
        const env = configService.get<string>('NODE_ENV');

        if (!apiKey || apiKey === 'replace-me' || env === 'test') {
          return new MockEmbeddingProvider();
        }
        return new OpenAIEmbeddingProvider(configService);
      },
      inject: [ConfigService],
    },
  ],
  exports: [RETRIEVAL_PORT, RetrievalService],
})
export class RetrievalModule {}
