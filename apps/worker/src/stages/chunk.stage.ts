import type { ExtractedPage } from './extract.stage';

export interface ChunkDocumentOptions {
  documentId: string;
  version: number;
  pages: ExtractedPage[];
  chunkTokens?: number;
  chunkOverlap?: number;
}

export interface DocumentChunk {
  documentId: string;
  version: number;
  chunkIndex: number;
  page: number;
  text: string;
  tokenCount: number;
}

export const DEFAULT_CHUNK_TOKENS = 800;
export const DEFAULT_CHUNK_OVERLAP = 120;

/**
 * Deterministically splits extracted pages into overlapping token windows.
 *
 * Defaults:
 * - INGESTION_CHUNK_TOKENS = 800
 * - INGESTION_CHUNK_OVERLAP = 120
 *
 * Each chunk carries `{ documentId, version, chunkIndex, page, text, tokenCount }`.
 * Same input pages ⇒ byte-identical chunk boundaries every run.
 */
export function chunkDocument(options: ChunkDocumentOptions): DocumentChunk[] {
  const { documentId, version, pages } = options;

  const envTokens = process.env.INGESTION_CHUNK_TOKENS
    ? parseInt(process.env.INGESTION_CHUNK_TOKENS, 10)
    : undefined;
  const envOverlap = process.env.INGESTION_CHUNK_OVERLAP
    ? parseInt(process.env.INGESTION_CHUNK_OVERLAP, 10)
    : undefined;

  const chunkTokens = options.chunkTokens ?? envTokens ?? DEFAULT_CHUNK_TOKENS;
  const chunkOverlap =
    options.chunkOverlap ?? envOverlap ?? DEFAULT_CHUNK_OVERLAP;

  if (chunkTokens <= 0) {
    throw new Error('chunkTokens must be greater than 0');
  }

  if (chunkOverlap < 0 || chunkOverlap >= chunkTokens) {
    throw new Error(
      'chunkOverlap must be non-negative and less than chunkTokens',
    );
  }

  const step = chunkTokens - chunkOverlap;
  const chunks: DocumentChunk[] = [];
  let chunkIndex = 0;

  for (const pageObj of pages) {
    const text = pageObj.text.trim();
    if (!text) {
      continue;
    }

    const tokens = text.split(/\s+/).filter(Boolean);
    if (tokens.length === 0) {
      continue;
    }

    for (let start = 0; start < tokens.length; start += step) {
      const windowTokens = tokens.slice(start, start + chunkTokens);

      chunks.push({
        documentId,
        version,
        chunkIndex: chunkIndex++,
        page: pageObj.page,
        text: windowTokens.join(' '),
        tokenCount: windowTokens.length,
      });
    }
  }

  return chunks;
}
