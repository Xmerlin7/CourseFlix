import { VectorStoreAdapter, toVectorLiteral } from './vector-store.adapter';
import type { DocumentChunk } from '../stages/chunk.stage';
import type { VideoChunk } from '../stages/caption-chunk.stage';

describe('VectorStoreAdapter', () => {
  let adapter: VectorStoreAdapter;
  let dataSource: { query: jest.Mock };

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
    dataSource = { query: jest.fn().mockResolvedValue({ rowCount: 1 }) };
    adapter = new VectorStoreAdapter(dataSource as unknown as never);
  });

  it('upserts document chunks with pgvector embedding and deterministic vector ID', async () => {
    await adapter.upsertDocumentChunks([
      { chunk: validChunk, courseId, vector: validVector, isActive: true },
    ]);

    expect(dataSource.query).toHaveBeenCalledTimes(1);
    const [sql, params] = dataSource.query.mock.calls[0] as [string, unknown[]];

    expect(sql).toContain('INSERT INTO document_chunks');
    expect(sql).toContain('ON CONFLICT (vector_id) DO UPDATE');
    expect(sql).toContain('$9::vector');
    expect(params).toEqual([
      'doc-123',
      0,
      'Test chunk text',
      'Test chunk text',
      'doc-123:1:0',
      1,
      3,
      true,
      toVectorLiteral(validVector),
    ]);
  });

  it('upserts video chunks with the video: vector ID prefix', async () => {
    const videoChunk: VideoChunk = {
      videoTranscriptId: 'transcript-1',
      version: 1,
      chunkIndex: 2,
      startSeconds: 10,
      endSeconds: 20,
      text: 'Video chunk text',
      tokenCount: 4,
    };

    await adapter.upsertVideoChunks([
      { chunk: videoChunk, courseId, vector: validVector, isActive: true },
    ]);

    const [sql, params] = dataSource.query.mock.calls[0] as [string, unknown[]];
    expect(sql).toContain('INSERT INTO video_chunks');
    expect(sql).toContain('ON CONFLICT (vector_id) DO UPDATE');
    expect(params[0]).toBe('transcript-1');
    expect(params[4]).toBe('video:transcript-1:1:2');
  });

  it('returns chunk texts by vector ID from both tables', async () => {
    dataSource.query
      .mockResolvedValueOnce([
        { vector_id: 'doc-123:1:0', text: 'Document text' },
      ])
      .mockResolvedValueOnce([
        { vector_id: 'video:transcript-1:1:2', text: 'Video text' },
      ]);

    const texts = await adapter.getChunkTexts([
      'doc-123:1:0',
      'video:transcript-1:1:2',
    ]);

    expect(texts).toEqual([
      { vectorId: 'doc-123:1:0', text: 'Document text' },
      { vectorId: 'video:transcript-1:1:2', text: 'Video text' },
    ]);
  });

  it('throws error if courseId is missing from metadata', async () => {
    await expect(
      adapter.upsertDocumentChunks([
        { chunk: validChunk, courseId: '', vector: validVector },
      ]),
    ).rejects.toThrow(
      'Vector store metadata validation failed: courseId is required and must be a string',
    );
  });

  it('throws error if page is missing from metadata', async () => {
    const invalidChunk = {
      ...validChunk,
      page: undefined as unknown as number,
    };

    await expect(
      adapter.upsertDocumentChunks([
        { chunk: invalidChunk, courseId, vector: validVector },
      ]),
    ).rejects.toThrow(
      'Vector store metadata validation failed: page is required and must be a number',
    );
  });

  it('throws error if chunkIndex is missing from metadata', async () => {
    const invalidChunk = {
      ...validChunk,
      chunkIndex: undefined as unknown as number,
    };

    await expect(
      adapter.upsertDocumentChunks([
        { chunk: invalidChunk, courseId, vector: validVector },
      ]),
    ).rejects.toThrow(
      'Vector store metadata validation failed: chunkIndex is required and must be a number',
    );
  });
});
