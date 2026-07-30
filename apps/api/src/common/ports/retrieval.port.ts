export const RETRIEVAL_PORT = Symbol('RETRIEVAL_PORT');

export interface SearchQueryInput {
  courseId: string;
  query: string;
  topK?: number;
}

export interface RetrievedChunk {
  chunkId: string;
  documentId: string;
  page: number;
  excerpt: string;
  score: number;
}

export interface RetrievalPort {
  search(input: SearchQueryInput): Promise<RetrievedChunk[]>;
}
