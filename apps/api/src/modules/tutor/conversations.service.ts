import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Repository } from 'typeorm';
import { ChatConversationEntity } from './entities/chat-conversation.entity';
import {
  ChatMessageEntity,
  ChatRole,
  ChatSenderType,
} from './entities/chat-message.entity';
import { ChatMessageSourceChunkEntity } from './entities/chat-message-source-chunk.entity';

export interface SaveMessageInput {
  conversationId: string;
  senderType: ChatSenderType;
  role: ChatRole;
  messageText: string;
  modelName?: string | null;
  provider?: string | null;
  promptVersion?: string | null;
  tokensUsed?: number | null;
}

export interface SaveSourceChunkInput {
  messageId: string;
  chunkId: string;
  relevanceScore: number;
  excerpt: string;
  vectorId: string;
}

export interface CourseConversationMessage {
  id: string;
  senderType: ChatSenderType;
  role: ChatRole;
  messageText: string;
  createdAt: Date;
}

@Injectable()
export class ConversationsService {
  constructor(
    @InjectRepository(ChatConversationEntity)
    private readonly conversationsRepository: Repository<ChatConversationEntity>,
    @InjectRepository(ChatMessageEntity)
    private readonly messagesRepository: Repository<ChatMessageEntity>,
    @InjectRepository(ChatMessageSourceChunkEntity)
    private readonly sourceChunksRepository: Repository<ChatMessageSourceChunkEntity>,
  ) {}

  async getOrCreateActiveConversation(
    studentId: string,
    courseId: string,
  ): Promise<ChatConversationEntity> {
    const existing = await this.conversationsRepository.findOne({
      where: { studentId, courseId, status: 'active', deletedAt: IsNull() },
    });

    if (existing) {
      return existing;
    }

    return this.conversationsRepository.save(
      this.conversationsRepository.create({
        studentId,
        courseId,
        status: 'active',
      }),
    );
  }

  async saveMessage(input: SaveMessageInput): Promise<ChatMessageEntity> {
    const message = await this.messagesRepository.save(
      this.messagesRepository.create({
        conversationId: input.conversationId,
        senderType: input.senderType,
        role: input.role,
        messageText: input.messageText,
        modelName: input.modelName ?? null,
        provider: input.provider ?? null,
        promptVersion: input.promptVersion ?? null,
        tokensUsed: input.tokensUsed ?? null,
      }),
    );

    await this.conversationsRepository.update(input.conversationId, {
      lastMessageAt: new Date(),
    });

    return message;
  }

  async saveSourceChunks(inputs: SaveSourceChunkInput[]): Promise<void> {
    if (inputs.length === 0) {
      return;
    }

    await this.sourceChunksRepository.save(
      inputs.map((input) =>
        this.sourceChunksRepository.create({
          messageId: input.messageId,
          chunkId: input.chunkId,
          relevanceScore: input.relevanceScore.toFixed(4),
          excerpt: input.excerpt,
          vectorId: input.vectorId,
        }),
      ),
    );
  }

  async listCourseMessages(
    studentId: string,
    courseId: string,
  ): Promise<CourseConversationMessage[]> {
    const conversations = await this.conversationsRepository.find({
      where: {
        studentId,
        courseId,
        status: 'active',
        deletedAt: IsNull(),
      },
      select: { id: true },
    });

    if (conversations.length === 0) {
      return [];
    }

    return this.messagesRepository.find({
      where: {
        conversationId: In(conversations.map((conversation) => conversation.id)),
        deletedAt: IsNull(),
      },
      order: { createdAt: 'ASC' },
      select: {
        id: true,
        senderType: true,
        role: true,
        messageText: true,
        createdAt: true,
      },
    });
  }
}
