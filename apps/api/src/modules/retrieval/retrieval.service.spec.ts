import { DataSource } from 'typeorm';
import { RetrievalService } from './retrieval.service';
import { MockEmbeddingProvider } from './embedding.adapter';

describe('RetrievalService (pgvector Isolation Proof)', () => {
  let service: RetrievalService;
  let dataSource: { query: jest.Mock };
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

    mockEmbeddingProvider = new MockEmbeddingProvider();

    service = new RetrievalService(
      dataSource as unknown as DataSource,
      mockEmbeddingProvider,
    );
  });

  it('proves course isolation: embeds the query and filters by courseId in SQL', async () => {
    dataSource.query.mockResolvedValue([
      {
        id: chunkAId,
        vector_id: `${docAId}:1:0`,
        document_id: docAId,
        page_number: 1,
        distance: 0.05,
        excerpt:
          'لكل فعل رد فعل مساوٍ له في المقدار ومضاد له في الاتجاه (قانون نيوتن الثالث)',
      },
    ]);

    const results = await service.search({
      courseId: courseA,
      query: 'قانون نيوتن الثالث القوة والحركة',
      topK: 5,
    });

    expect(results).toHaveLength(1);
    expect(results[0].documentId).toBe(docAId);
    expect(results[0].page).toBe(1);
    expect(results[0].chunkId).toBe(chunkAId);
    expect(results[0].vectorId).toBe(`${docAId}:1:0`);
    expect(results[0].score).toBe(0.05);
    expect(results[0].excerpt).toContain('قانون نيوتن الثالث');

    const [sql, params] = dataSource.query.mock.calls[0] as [string, unknown[]];
    expect(sql).toContain('JOIN documents d ON d.id = c.document_id');
    expect(sql).toContain('d.course_id = $1');
    expect(sql).toContain('c.is_active = true');
    expect(sql).toContain('ORDER BY c.embedding <=> $2::vector');
    expect(sql).toContain('LIMIT $3');
    expect(params[0]).toBe(courseA);
    expect(String(params[1])).toMatch(/^\[.*\]$/);
    expect(params[2]).toBe(5);

    // Isolation: the query must never be scoped to courseB
    expect(params[0]).not.toBe(courseB);
    expect(results.some((r) => r.documentId === docBId)).toBe(false);
  });

  it('proves version isolation: only the is_active=true chunk is returned', async () => {
    dataSource.query.mockResolvedValue([
      {
        id: 'chunk-A-v2-db-id',
        vector_id: `${docAId}:2:0`,
        document_id: docAId,
        page_number: 1,
        distance: 0.02,
        excerpt: 'النسخة الحديثة الثانية من درس قانون نيوتن الثالث',
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
    expect(results.some((r) => r.vectorId === `${docAId}:1:0`)).toBe(false);
  });

  it('returns empty array if courseId has no matching chunks', async () => {
    dataSource.query.mockResolvedValue([]);

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

  describe('searchVideo', () => {
    const transcriptA = 'transcript-A-uuid';
    const transcriptB = 'transcript-B-uuid';
    const videoChunkAId = 'video-chunk-A-db-id';

    it('proves video isolation: filters by videoTranscriptId, never courseId', async () => {
      dataSource.query.mockResolvedValue([
        {
          id: videoChunkAId,
          vector_id: `video:${transcriptA}:1:0`,
          video_transcript_id: transcriptA,
          start_seconds: 180,
          end_seconds: 200,
          distance: 0.05,
          excerpt: 'في الدقيقة الثالثة يشرح المحاضر قانون نيوتن الثالث',
        },
      ]);

      const results = await service.searchVideo({
        videoTranscriptId: transcriptA,
        query: 'قانون نيوتن الثالث',
        topK: 5,
      });

      expect(results).toHaveLength(1);
      expect(results[0].chunkId).toBe(videoChunkAId);
      expect(results[0].videoTranscriptId).toBe(transcriptA);
      expect(results[0].startSeconds).toBe(180);
      expect(results[0].endSeconds).toBe(200);
      expect(results[0].vectorId).toBe(`video:${transcriptA}:1:0`);

      const [sql, params] = dataSource.query.mock.calls[0] as [
        string,
        unknown[],
      ];
      expect(sql).toContain('video_transcript_id = $1');
      expect(sql).toContain('is_active = true');
      expect(sql).toContain('ORDER BY embedding <=> $2::vector');
      expect(params[0]).toBe(transcriptA);
      expect(params[0]).not.toBe(transcriptB);
      expect(results.some((r) => r.videoTranscriptId === transcriptB)).toBe(
        false,
      );
    });

    it('returns empty array if videoTranscriptId has no matching chunks', async () => {
      dataSource.query.mockResolvedValue([]);

      const results = await service.searchVideo({
        videoTranscriptId: 'non-existent-transcript',
        query: 'الميكانيكا الكلاسيكية',
      });

      expect(results).toEqual([]);
    });

    it('throws error if videoTranscriptId is missing from search query input', async () => {
      await expect(
        service.searchVideo({
          videoTranscriptId: '',
          query: 'قانون نيوتن',
        }),
      ).rejects.toThrow(
        'Retrieval search failed: videoTranscriptId is required',
      );
    });
  });
});
