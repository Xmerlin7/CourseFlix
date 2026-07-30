import { MockEmbeddingProvider } from './embedding.adapter';

describe('MockEmbeddingProvider', () => {
  let provider: MockEmbeddingProvider;

  beforeEach(() => {
    provider = new MockEmbeddingProvider();
  });

  it('generates 1536-dimensional float vectors for input texts', async () => {
    const texts = ['First text snippet', 'Second text snippet'];
    const embeddings = await provider.embed(texts);

    expect(embeddings).toHaveLength(2);
    expect(embeddings[0]).toHaveLength(1536);
    expect(embeddings[1]).toHaveLength(1536);
    expect(typeof embeddings[0][0]).toBe('number');
  });

  it('produces byte-identical vectors for the same input text deterministically', async () => {
    const text = 'Classical mechanics Newton third law';

    const [v1] = await provider.embed([text]);
    const [v2] = await provider.embed([text]);

    expect(v1).toEqual(v2);
  });

  it('returns empty array when given empty input array', async () => {
    const embeddings = await provider.embed([]);
    expect(embeddings).toEqual([]);
  });
});
