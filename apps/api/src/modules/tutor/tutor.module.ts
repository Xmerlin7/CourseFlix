import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DocumentEntity } from '../documents/entities/document.entity';
import { EnrollmentsModule } from '../enrollments/enrollments.module';
import { InterventionsModule } from '../interventions/interventions.module';
import { RetrievalModule } from '../retrieval/retrieval.module';
import { SessionsModule } from '../sessions/sessions.module';
import {
  LLM_PROVIDER,
  MockLlmProvider,
  OpenAILlmProvider,
} from './adapters/llm.adapter';
import { ConversationsService } from './conversations.service';
import { ChatConversationEntity } from './entities/chat-conversation.entity';
import { ChatMessageEntity } from './entities/chat-message.entity';
import { ChatMessageSourceChunkEntity } from './entities/chat-message-source-chunk.entity';
import { AnswerPolicyService } from './prompt/answer-policy.service';
import { TutorController } from './tutor.controller';
import { TutorService } from './tutor.service';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([
      ChatConversationEntity,
      ChatMessageEntity,
      ChatMessageSourceChunkEntity,
      DocumentEntity,
    ]),
    EnrollmentsModule,
    InterventionsModule,
    RetrievalModule,
    SessionsModule,
    ThrottlerModule.forRoot([
      {
        ttl: Number(process.env.LOGIN_RATE_LIMIT_WINDOW_SECONDS ?? 900) * 1000,
        limit: Number(process.env.LOGIN_RATE_LIMIT_MAX_ATTEMPTS ?? 5),
      },
    ]),
  ],
  controllers: [TutorController],
  providers: [
    ConversationsService,
    AnswerPolicyService,
    TutorService,
    {
      provide: LLM_PROVIDER,
      useFactory: (configService: ConfigService) => {
        const apiKey =
          configService.get<string>('OPENAI_API_KEY') ||
          configService.get<string>('LLM_API_KEY') ||
          configService.get<string>('EMBEDDING_API_KEY');
        const env = configService.get<string>('NODE_ENV');

        if (!apiKey || apiKey === 'replace-me' || env === 'test') {
          return new MockLlmProvider();
        }

        return new OpenAILlmProvider(configService);
      },
      inject: [ConfigService],
    },
  ],
})
export class TutorModule {}
