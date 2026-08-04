/* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unnecessary-type-assertion, @typescript-eslint/require-await */
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test } from '@nestjs/testing';
import { Repository } from 'typeorm';
import { ChatConversationEntity } from './entities/chat-conversation.entity';
import { ChatMessageEntity } from './entities/chat-message.entity';
import { ChatMessageSourceChunkEntity } from './entities/chat-message-source-chunk.entity';
import { ConversationsService } from './conversations.service';

describe('ConversationsService', () => {
  let service: ConversationsService;
  let conversationsRepository: jest.Mocked<
    Partial<Repository<ChatConversationEntity>>
  >;
  let messagesRepository: jest.Mocked<Partial<Repository<ChatMessageEntity>>>;
  let sourceChunksRepository: jest.Mocked<
    Partial<Repository<ChatMessageSourceChunkEntity>>
  >;

  beforeEach(async () => {
    conversationsRepository = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn((input) => input as ChatConversationEntity),
      save: jest.fn(
        async (input) =>
          ({
            id: 'conversation-1',
            ...input,
          }) as ChatConversationEntity,
      ),
      update: jest.fn(),
    };
    messagesRepository = {
      find: jest.fn(),
      create: jest.fn((input) => input as ChatMessageEntity),
      save: jest.fn(
        async (input) =>
          ({
            id: 'message-1',
            ...input,
          }) as ChatMessageEntity,
      ),
    };
    sourceChunksRepository = {
      create: jest.fn((input) => input as ChatMessageSourceChunkEntity),
      save: jest.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        ConversationsService,
        {
          provide: getRepositoryToken(ChatConversationEntity),
          useValue: conversationsRepository,
        },
        {
          provide: getRepositoryToken(ChatMessageEntity),
          useValue: messagesRepository,
        },
        {
          provide: getRepositoryToken(ChatMessageSourceChunkEntity),
          useValue: sourceChunksRepository,
        },
      ],
    }).compile();

    service = moduleRef.get(ConversationsService);
  });

  it('reuses an existing active conversation for a student and course', async () => {
    conversationsRepository.findOne?.mockResolvedValue({
      id: 'existing-conversation',
      studentId: 'student-1',
      courseId: 'course-1',
      status: 'active',
    } as ChatConversationEntity);

    const result = await service.getOrCreateActiveConversation(
      'student-1',
      'course-1',
    );

    expect(result.id).toBe('existing-conversation');
    expect(conversationsRepository.save).not.toHaveBeenCalled();
  });

  it('creates a conversation when no active one exists', async () => {
    conversationsRepository.findOne?.mockResolvedValue(null);

    const result = await service.getOrCreateActiveConversation(
      'student-1',
      'course-1',
    );

    expect(result.id).toBe('conversation-1');
    expect(conversationsRepository.create).toHaveBeenCalledWith({
      studentId: 'student-1',
      courseId: 'course-1',
      status: 'active',
    });
  });

  it('persists assistant message metadata', async () => {
    const result = await service.saveMessage({
      conversationId: 'conversation-1',
      senderType: 'ai_tutor',
      role: 'assistant',
      messageText: 'answer',
      modelName: 'mock-model',
      provider: 'mock',
      promptVersion: 'prompt-v1',
      tokensUsed: 42,
    });

    expect(result.id).toBe('message-1');
    expect(messagesRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        modelName: 'mock-model',
        provider: 'mock',
        promptVersion: 'prompt-v1',
        tokensUsed: 42,
      }),
    );
    expect(conversationsRepository.update).toHaveBeenCalledWith(
      'conversation-1',
      expect.objectContaining({ lastMessageAt: expect.any(Date) }),
    );
  });

  it('lists non-deleted messages for active conversations in chronological order', async () => {
    conversationsRepository.find?.mockResolvedValue([
      { id: 'conversation-1' } as ChatConversationEntity,
    ]);
    messagesRepository.find?.mockResolvedValue([
      {
        id: 'message-1',
        conversationId: 'conversation-1',
        senderType: 'student',
        role: 'user',
        messageText: 'question',
        createdAt: new Date('2026-08-04T09:00:00.000Z'),
      } as ChatMessageEntity,
      {
        id: 'message-2',
        conversationId: 'conversation-1',
        senderType: 'ai_tutor',
        role: 'assistant',
        messageText: 'answer',
        createdAt: new Date('2026-08-04T09:00:01.000Z'),
      } as ChatMessageEntity,
    ]);

    const result = await service.listCourseMessages('student-1', 'course-1');

    expect(conversationsRepository.find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          studentId: 'student-1',
          courseId: 'course-1',
          status: 'active',
        }),
        select: { id: true },
      }),
    );
    expect(messagesRepository.find).toHaveBeenCalledWith(
      expect.objectContaining({
        order: { createdAt: 'ASC' },
        select: expect.objectContaining({
          messageText: true,
          createdAt: true,
        }),
      }),
    );
    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({
      id: 'message-1',
      senderType: 'student',
      messageText: 'question',
    });
  });

  it('returns an empty history without reading messages when no active conversation exists', async () => {
    conversationsRepository.find?.mockResolvedValue([]);

    await expect(
      service.listCourseMessages('student-1', 'course-1'),
    ).resolves.toEqual([]);
    expect(messagesRepository.find).not.toHaveBeenCalled();
  });
});
