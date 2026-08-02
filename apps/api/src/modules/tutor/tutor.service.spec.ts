import { BadRequestException, ForbiddenException, ServiceUnavailableException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test } from '@nestjs/testing';
import { Repository } from 'typeorm';
import { RETRIEVAL_PORT, RetrievedChunk, RetrievalPort } from '../../common/ports/retrieval.port';
import { DocumentEntity } from '../documents/entities/document.entity';
import { EnrollmentsService } from '../enrollments/enrollments.service';
import { LLM_PROVIDER, LlmProvider } from './adapters/llm.adapter';
import { ConversationsService } from './conversations.service';
import { AnswerPolicyService } from './prompt/answer-policy.service';
import { TutorService } from './tutor.service';

describe('TutorService', () => {
  let service: TutorService;
  let enrollmentsService: jest.Mocked<Pick<EnrollmentsService, 'assertStudentEnrolled'>>;
  let conversationsService: jest.Mocked<
    Pick<
      ConversationsService,
      'getOrCreateActiveConversation' | 'saveMessage' | 'saveSourceChunks'
    >
  >;
  let retrievalPort: jest.Mocked<RetrievalPort>;
  let llmProvider: jest.Mocked<LlmProvider>;
  let documentsRepository: jest.Mocked<Pick<Repository<DocumentEntity>, 'find'>>;

  const relevantChunk: RetrievedChunk = {
    chunkId: 'chunk-db-1',
    vectorId: 'doc-1:1:0',
    documentId: 'doc-1',
    page: 2,
    excerpt: 'قانون نيوتن الثالث ينص على أن لكل فعل رد فعل.',
    score: 0.1,
  };

  beforeEach(async () => {
    enrollmentsService = {
      assertStudentEnrolled: jest.fn().mockResolvedValue({ id: 'enrollment-1' }),
    };
    conversationsService = {
      getOrCreateActiveConversation: jest
        .fn()
        .mockResolvedValue({ id: 'conversation-1' }),
      saveMessage: jest
        .fn()
        .mockImplementation(async (input) => ({ id: `${input.role}-message`, ...input })),
      saveSourceChunks: jest.fn().mockResolvedValue(undefined),
    };
    retrievalPort = {
      search: jest.fn().mockResolvedValue([relevantChunk]),
    };
    llmProvider = {
      generateAnswer: jest.fn().mockResolvedValue({
        answer: 'الإجابة من المادة.',
        citedChunkIds: ['chunk-db-1'],
        modelName: 'mock-model',
        provider: 'mock',
        tokensUsed: 12,
      }),
    };
    documentsRepository = {
      find: jest.fn().mockResolvedValue([
        { id: 'doc-1', fileName: 'physics.pdf' } as DocumentEntity,
      ]),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        TutorService,
        {
          provide: EnrollmentsService,
          useValue: enrollmentsService,
        },
        {
          provide: ConversationsService,
          useValue: conversationsService,
        },
        {
          provide: AnswerPolicyService,
          useValue: {
            getRelevantChunks: (chunks: RetrievedChunk[]) =>
              chunks.filter((chunk) => chunk.score <= 0.35),
          },
        },
        {
          provide: RETRIEVAL_PORT,
          useValue: retrievalPort,
        },
        {
          provide: LLM_PROVIDER,
          useValue: llmProvider,
        },
        {
          provide: getRepositoryToken(DocumentEntity),
          useValue: documentsRepository,
        },
      ],
    }).compile();

    service = moduleRef.get(TutorService);
  });

  it('rejects empty messages', async () => {
    await expect(
      service.sendMessage({
        courseId: 'course-1',
        studentId: 'student-1',
        message: '   ',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('propagates forbidden enrollment checks', async () => {
    enrollmentsService.assertStudentEnrolled.mockRejectedValueOnce(
      new ForbiddenException('not enrolled'),
    );

    await expect(
      service.sendMessage({
        courseId: 'course-1',
        studentId: 'student-1',
        message: 'ما هو قانون نيوتن الثالث؟',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('returns no_answer without calling the provider when relevance is too low', async () => {
    retrievalPort.search.mockResolvedValueOnce([
      { ...relevantChunk, score: 0.9 },
    ]);

    const result = await service.sendMessage({
      courseId: 'course-1',
      studentId: 'student-1',
      message: 'سؤال خارج المحتوى',
    });

    expect(result.status).toBe('no_answer');
    expect(result.citations).toEqual([]);
    expect(llmProvider.generateAnswer).not.toHaveBeenCalled();
  });

  it('returns a cited answer and persists source chunks', async () => {
    const result = await service.sendMessage({
      courseId: 'course-1',
      studentId: 'student-1',
      message: 'ما هو قانون نيوتن الثالث؟',
    });

    expect(result).toEqual({
      messageId: 'assistant-message',
      status: 'answered',
      answer: 'الإجابة من المادة.',
      citations: [
        {
          documentId: 'doc-1',
          documentName: 'physics.pdf',
          page: 2,
          excerpt: relevantChunk.excerpt,
        },
      ],
    });
    expect(conversationsService.saveSourceChunks).toHaveBeenCalledWith([
      {
        messageId: 'assistant-message',
        chunkId: 'chunk-db-1',
        relevanceScore: 0.1,
        excerpt: relevantChunk.excerpt,
        vectorId: 'doc-1:1:0',
      },
    ]);
  });

  it('downgrades invented citations to no_answer', async () => {
    llmProvider.generateAnswer.mockResolvedValueOnce({
      answer: 'إجابة بلا مصدر حقيقي.',
      citedChunkIds: ['invented-chunk'],
      modelName: 'mock-model',
      provider: 'mock',
      tokensUsed: 12,
    });

    const result = await service.sendMessage({
      courseId: 'course-1',
      studentId: 'student-1',
      message: 'ما هو قانون نيوتن الثالث؟',
    });

    expect(result.status).toBe('no_answer');
    expect(result.citations).toEqual([]);
    expect(conversationsService.saveSourceChunks).not.toHaveBeenCalled();
  });

  it('returns safe 503 when the provider fails', async () => {
    llmProvider.generateAnswer.mockRejectedValueOnce(new Error('raw failure'));

    await expect(
      service.sendMessage({
        courseId: 'course-1',
        studentId: 'student-1',
        message: 'ما هو قانون نيوتن الثالث؟',
      }),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
  });
});
