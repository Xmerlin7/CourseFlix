import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { ChromaClient, Collection } from 'chromadb';
import {
  RetrievalPort,
  SearchQueryInput,
  RetrievedChunk,
} from '../../common/ports/retrieval.port';
import type { EmbeddingProvider } from './adapters/embedding.adapter';
import { EMBEDDING_PROVIDER } from './adapters/embedding.adapter';

interface DocumentChunkRow {
  id: string;
  vector_id: string;
  document_id: string;
  page_number: number;
  text_preview: string;
}

interface ChromaQueryResult {
  ids?: string[][];
  distances?: (number | null)[][];
  documents?: (string | null)[][];
}

@Injectable()
export class RetrievalService implements RetrievalPort {
  private readonly logger = new Logger(RetrievalService.name);
  private collection: Collection | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly dataSource: DataSource,
    @Inject(EMBEDDING_PROVIDER)
    private readonly embeddingProvider: EmbeddingProvider,
  ) {}

  private async getCollection(): Promise<Collection> {
    if (this.collection) {
      return this.collection;
    }

    const chromaUrl =
      this.configService.get<string>('CHROMA_URL') || 'http://localhost:8000';
    const collectionName =
      this.configService.get<string>('CHROMA_COLLECTION') || 'courseflix-dev';

    const client = new ChromaClient({ path: chromaUrl });
    this.collection = await client.getOrCreateCollection({
      name: collectionName,
    });

    return this.collection;
  }

  /**
   * Queries ChromaDB vector store with mandatory course-level isolation filter.
   *
   * Filter rule: `where: { courseId: input.courseId, isActive: true }`
   *
   * Joins retrieved vector IDs with Postgres `document_chunks` table to populate
   * exact page numbers and document IDs.
   */
  async search(input: SearchQueryInput): Promise<RetrievedChunk[]> {
    const { courseId, query, topK = 5 } = input;

    if (!courseId) {
      throw new Error('Retrieval search failed: courseId is required');
    }

    if (!query || !query.trim()) {
      return [];
    }

    const [queryVector] = await this.embeddingProvider.embed([query]);
    if (!queryVector || queryVector.length === 0) {
      return [];
    }

    const collection = await this.getCollection();

    // Mandatory courseId and isActive isolation filter
    const queryResponse = (await collection.query({
      queryEmbeddings: [queryVector],
      nResults: topK,
      where: {
        courseId,
        isActive: true,
      },
    })) as unknown as ChromaQueryResult;

    const ids = queryResponse.ids?.[0] || [];
    const distances = queryResponse.distances?.[0] || [];
    const documents = queryResponse.documents?.[0] || [];

    if (ids.length === 0) {
      return [];
    }

    // Join with Postgres document_chunks table to retrieve the relational
    // chunk ID used by Tutor citation persistence.
    const chunkRows = (await this.dataSource.query(
      `SELECT id, vector_id, document_id, page_number, text_preview
         FROM document_chunks
        WHERE vector_id = ANY($1)
          AND is_active = true`,
      [ids],
    )) as unknown as DocumentChunkRow[];

    const chunkMap = new Map<string, DocumentChunkRow>();
    for (const row of chunkRows) {
      chunkMap.set(row.vector_id, row);
    }

    const results: RetrievedChunk[] = [];

    for (let i = 0; i < ids.length; i++) {
      const vectorId = ids[i];
      const distance = distances[i] ?? 0;
      const chromaDoc = documents[i] || '';
      const chunkRow = chunkMap.get(vectorId);

      // If document chunk is no longer active in Postgres, skip it
      if (!chunkRow) {
        continue;
      }

      results.push({
        chunkId: chunkRow.id,
        vectorId,
        documentId: chunkRow.document_id,
        page: chunkRow.page_number,
        excerpt: chromaDoc || chunkRow.text_preview,
        score: distance,
      });
    }

    return results;
  }
}
