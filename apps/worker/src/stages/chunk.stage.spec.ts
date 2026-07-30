import {
  chunkDocument,
  DEFAULT_CHUNK_TOKENS,
  DEFAULT_CHUNK_OVERLAP,
} from './chunk.stage';
import type { ExtractedPage } from './extract.stage';

describe('chunkDocument stage', () => {
  const documentId = 'doc-123-uuid';
  const version = 1;

  it('splits single short page into a single chunk with correct metadata', () => {
    const pages: ExtractedPage[] = [
      { page: 1, text: 'Newton third law states for every action equal opposite reaction.' },
    ];

    const chunks = chunkDocument({ documentId, version, pages });

    expect(chunks).toHaveLength(1);
    expect(chunks[0]).toEqual({
      documentId,
      version,
      chunkIndex: 0,
      page: 1,
      text: 'Newton third law states for every action equal opposite reaction.',
      tokenCount: 10,
    });
  });

  it('chunks deterministically with overlapping token windows across pages', () => {
    // Generate 1500 words for page 1
    const page1Words = Array.from({ length: 1500 }, (_, i) => `word${i}`);
    const pages: ExtractedPage[] = [
      { page: 1, text: page1Words.join(' ') },
    ];

    // Using chunkTokens = 800, chunkOverlap = 120 (step = 680)
    const chunks = chunkDocument({
      documentId,
      version,
      pages,
      chunkTokens: 800,
      chunkOverlap: 120,
    });

    // 1500 words:
    // chunk 0: start 0, 800 words (0..799)
    // chunk 1: start 680, 800 words (680..1479)
    // chunk 2: start 1360, 140 words (1360..1499)
    expect(chunks).toHaveLength(3);

    expect(chunks[0].chunkIndex).toBe(0);
    expect(chunks[0].tokenCount).toBe(800);
    expect(chunks[0].text.startsWith('word0')).toBe(true);

    expect(chunks[1].chunkIndex).toBe(1);
    expect(chunks[1].tokenCount).toBe(800);
    expect(chunks[1].text.startsWith('word680')).toBe(true);

    expect(chunks[2].chunkIndex).toBe(2);
    expect(chunks[2].tokenCount).toBe(140);
    expect(chunks[2].text.startsWith('word1360')).toBe(true);
  });

  it('produces byte-identical output across multiple runs for identical input', () => {
    const pages: ExtractedPage[] = [
      { page: 1, text: 'Arabic physics classical mechanics lesson text example.' },
      { page: 2, text: 'Newtonian force equations momentum equilibrium vectors.' },
    ];

    const run1 = chunkDocument({ documentId, version, pages });
    const run2 = chunkDocument({ documentId, version, pages });

    expect(JSON.stringify(run1)).toBe(JSON.stringify(run2));
  });

  it('skips empty pages without error', () => {
    const pages: ExtractedPage[] = [
      { page: 1, text: '   ' },
      { page: 2, text: 'Actual content on page two.' },
    ];

    const chunks = chunkDocument({ documentId, version, pages });

    expect(chunks).toHaveLength(1);
    expect(chunks[0].page).toBe(2);
    expect(chunks[0].chunkIndex).toBe(0);
  });

  it('validates invalid token and overlap parameters', () => {
    const pages: ExtractedPage[] = [{ page: 1, text: 'Sample text.' }];

    expect(() =>
      chunkDocument({ documentId, version, pages, chunkTokens: 0 }),
    ).toThrow('chunkTokens must be greater than 0');

    expect(() =>
      chunkDocument({ documentId, version, pages, chunkTokens: 100, chunkOverlap: 100 }),
    ).toThrow('chunkOverlap must be non-negative and less than chunkTokens');
  });
});
