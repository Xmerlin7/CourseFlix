import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { RetrievalService } from './retrieval.service';
import { MockEmbeddingProvider } from './adapters/embedding.adapter';

interface MockQueryOptions {
  where: {
    courseId: string;
    isActive: boolean;
  };
}

describe('RetrievalService (Isolation Proof)', () => {
  let service: RetrievalService;
  let dataSource: { query: jest.Mock };
  let mockCollection: { query: jest.Mock };
  let mockEmbeddingProvider: MockEmbeddingProvider;

  const courseA = 'course-A-physics-mechanics';
  const courseB = 'course-B-physics-dynamics';

  const docAId = 'doc-A-uuid';
  const docBId = 'doc-B-uuid';
  const chunkAId = 'chunk-A-db-id';

  beforeEach(() => {
    dataSource = {
      query: jest.fn(),
    };

    mockCollection = {
      query: jest.fn(),
    };

    mockEmbeddingProvider = new MockEmbeddingProvider();

    const configService = {
      get: jest.fn((key: string) => {
        if (key === 'CHROMA_URL') return 'http://localhost:8000';
        if (key === 'CHROMA_COLLECTION') return 'courseflix-test';
        return undefined;
      }),
    } as unknown as ConfigService;

    service = new RetrievalService(
      configService,
      dataSource as unknown as DataSource,
      mockEmbeddingProvider,
    );

    // Inject mock collection directly
    Object.defineProperty(service, 'collection', {
      value: mockCollection,
      writable: true,
    });
  });

  it('proves course isolation: queries course A and returns ZERO chunks from course B despite identical Arabic physics text', async () => {
    // 1. Mock ChromaDB response when queried with courseA filter (only returns courseA chunks)
    mockCollection.query.mockImplementation((options: MockQueryOptions) => {
      const whereClause = options.where;

      // Verify mandatory isolation filter
      expect(whereClause).toEqual({
        courseId: courseA,
        isActive: true,
      });

      if (whereClause.courseId === courseA) {
        return Promise.resolve({
          ids: [[`${docAId}:1:0`]],
          distances: [[0.05]],
          documents: [
            [
              'لكل فعل رد فعل مساوٍ له في المقدار ومضاد له في الاتجاه (قانون نيوتن الثالث)',
            ],
          ],
          metadatas: [
            [
              {
                courseId: courseA,
                documentId: docAId,
                version: 1,
                chunkIndex: 0,
                page: 1,
                isActive: true,
              },
            ],
          ],
        });
      }

      return Promise.resolve({
        ids: [[]],
        distances: [[]],
        documents: [[]],
        metadatas: [[]],
      });
    });

    // 2. Mock Postgres document_chunks DB query response
    dataSource.query.mockResolvedValue([
      {
        id: chunkAId,
        vector_id: `${docAId}:1:0`,
        document_id: docAId,
        page_number: 1,
        text_preview:
          'لكل فعل رد فعل مساوٍ له في المقدار ومضاد له في الاتجاه (قانون نيوتن الثالث)',
      },
    ]);

    const results = await service.search({
      courseId: courseA,
      query: 'قانون نيوتن الثالث القوة والحركة',
      topK: 5,
    });

    // Assert results returned for Course A
    expect(results).toHaveLength(1);
    expect(results[0].documentId).toBe(docAId);
    expect(results[0].page).toBe(1);
    expect(results[0].chunkId).toBe(chunkAId);
    expect(results[0].vectorId).toBe(`${docAId}:1:0`);
    expect(results[0].excerpt).toContain('قانون نيوتن الثالث');

    // Assert ZERO chunks from Course B were queried or returned
    const calls = mockCollection.query.mock.calls as unknown as Array<
      [MockQueryOptions]
    >;
    const chromaCallArgs = calls[0][0];
    expect(chromaCallArgs.where.courseId).not.toBe(courseB);
    expect(results.some((r) => r.documentId === docBId)).toBe(false);
  });

  it('proves version isolation: superseded versions (version < active, isActive = false) are NEVER returned', async () => {
    // 1. Mock ChromaDB response with isActive: true filter
    mockCollection.query.mockImplementation((options: MockQueryOptions) => {
      expect(options.where).toEqual({
        courseId: courseA,
        isActive: true,
      });

      // Returns active version 2 chunk only
      return Promise.resolve({
        ids: [[`${docAId}:2:0`]],
        distances: [[0.02]],
        documents: [['النسخة الحديثة الثانية من درس قانون نيوتن الثالث']],
        metadatas: [
          [
            {
              courseId: courseA,
              documentId: docAId,
              version: 2,
              chunkIndex: 0,
              page: 1,
              isActive: true,
            },
          ],
        ],
      });
    });

    dataSource.query.mockResolvedValue([
      {
        id: 'chunk-A-v2-db-id',
        vector_id: `${docAId}:2:0`,
        document_id: docAId,
        page_number: 1,
        text_preview: 'النسخة الحديثة الثانية من درس قانون نيوتن الثالث',
      },
    ]);

    const results = await service.search({
      courseId: courseA,
      query: 'قانون نيوتن الثالث',
      topK: 5,
    });

    expect(results).toHaveLength(1);
    expect(results[0].chunkId).toBe('chunk-A-v2-db-id');
    expect(results[0].vectorId).toBe(`${docAId}:2:0`);

    // Verify superseded version 1 (`${docAId}:1:0`) was NOT returned
    expect(results.some((r) => r.vectorId === `${docAId}:1:0`)).toBe(false);
  });

  it('returns empty array if courseId has no matching chunks', async () => {
    mockCollection.query.mockResolvedValue({
      ids: [[]],
      distances: [[]],
      documents: [[]],
      metadatas: [[]],
    });

    const results = await service.search({
      courseId: 'non-existent-course',
      query: 'الميكانيكا الكلاسيكية',
    });

    expect(results).toEqual([]);
  });

  it('throws error if courseId is missing from search query input', async () => {
    await expect(
      service.search({
        courseId: '',
        query: 'قانون نيوتن',
      }),
    ).rejects.toThrow('Retrieval search failed: courseId is required');
  });
});
