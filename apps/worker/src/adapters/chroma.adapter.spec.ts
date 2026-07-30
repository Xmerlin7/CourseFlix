import { ConfigService } from '@nestjs/config';
import { ChromaAdapter, ChromaUpsertInput } from './chroma.adapter';
import type { DocumentChunk } from '../stages/chunk.stage';

describe('ChromaAdapter', () => {
  let adapter: ChromaAdapter;
  let mockCollection: { upsert: jest.Mock };
  let mockClient: { getOrCreateCollection: jest.Mock };

  const validChunk: DocumentChunk = {
    documentId: 'doc-123',
    version: 1,
    chunkIndex: 0,
    page: 1,
    text: 'Test chunk text',
    tokenCount: 3,
  };

  const validVector = [0.1, 0.2, 0.3];
  const courseId = 'course-456';

  beforeEach(() => {
    mockCollection = { upsert: jest.fn().mockResolvedValue(undefined) };
    mockClient = { getOrCreateCollection: jest.fn().mockResolvedValue(mockCollection) };

    const configService = {
      get: jest.fn((key: string) => {
        if (key === 'CHROMA_URL') return 'http://localhost:8000';
        if (key === 'CHROMA_COLLECTION') return 'courseflix-test';
        return undefined;
      }),
    } as unknown as ConfigService;

    adapter = new ChromaAdapter(configService);
    // Inject mock collection directly
    (adapter as any).collection = mockCollection;
  });

  it('upserts valid chunk with correct vector ID formatting `${documentId}:${version}:${chunkIndex}`', async () => {
    const input: ChromaUpsertInput = {
      chunk: validChunk,
      courseId,
      vector: validVector,
      isActive: true,
    };

    await adapter.upsert([input]);

    expect(mockCollection.upsert).toHaveBeenCalledWith({
      ids: ['doc-123:1:0'],
      embeddings: [[0.1, 0.2, 0.3]],
      documents: ['Test chunk text'],
      metadatas: [
        {
          courseId: 'course-456',
          documentId: 'doc-123',
          version: 1,
          chunkIndex: 0,
          page: 1,
          isActive: true,
        },
      ],
    });
  });

  it('throws error if courseId is missing from metadata', async () => {
    const input = {
      chunk: validChunk,
      courseId: '',
      vector: validVector,
    };

    await expect(adapter.upsert([input as any])).rejects.toThrow(
      'Chroma metadata validation failed: courseId is required and must be a string',
    );
  });

  it('throws error if page is missing from metadata', async () => {
    const invalidChunk = { ...validChunk, page: undefined as any };
    const input = {
      chunk: invalidChunk,
      courseId,
      vector: validVector,
    };

    await expect(adapter.upsert([input])).rejects.toThrow(
      'Chroma metadata validation failed: page is required and must be a number',
    );
  });

  it('throws error if chunkIndex is missing from metadata', async () => {
    const invalidChunk = { ...validChunk, chunkIndex: undefined as any };
    const input = {
      chunk: invalidChunk,
      courseId,
      vector: validVector,
    };

    await expect(adapter.upsert([input])).rejects.toThrow(
      'Chroma metadata validation failed: chunkIndex is required and must be a number',
    );
  });
});
