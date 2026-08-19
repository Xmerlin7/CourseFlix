import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChromaClient, Collection } from 'chromadb';
import type { EmbeddingFunction as ChromaEmbeddingFunction } from 'chromadb';
import type { DocumentChunk } from '../stages/chunk.stage';

export const CHROMA_ADAPTER = Symbol('CHROMA_ADAPTER');

export interface ChromaChunkMetadata {
  courseId: string;
  documentId: string;
  version: number;
  chunkIndex: number;
  page: number;
  isActive: boolean;
  [key: string]: string | number | boolean;
}

export interface ChromaUpsertInput {
  chunk: DocumentChunk;
  courseId: string;
  vector: number[];
  isActive?: boolean;
}

const explicitEmbeddingsOnly: ChromaEmbeddingFunction = {
  name: 'courseflix-explicit-embeddings',
  async generate(): Promise<number[][]> {
    throw new Error('CourseFlix passes embeddings explicitly to ChromaDB');
  },
};

function isChromaNotFoundError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  return (
    error.name === 'ChromaNotFoundError' ||
    error.message.toLowerCase().includes('resource could not be found')
  );
}

/**
 * ChromaDB Vector Store Adapter.
 *
 * Manages document vector embeddings and chunk metadata in ChromaDB.
 * Enforces mandatory metadata validation before every write to guarantee course-level vector isolation.
 */
@Injectable()
export class ChromaAdapter {
  private readonly logger = new Logger(ChromaAdapter.name);
  private client: ChromaClient | null = null;
  private collection: Collection | null = null;

  constructor(private readonly configService: ConfigService) {}

  /**
   * Initializes ChromaDB client connection and gets or creates the target collection.
   */
  async getCollection(): Promise<Collection> {
    if (this.collection) {
      return this.collection;
    }

    const chromaUrl =
      this.configService.get<string>('CHROMA_URL') || 'http://localhost:8000';
    const collectionName =
      this.configService.get<string>('CHROMA_COLLECTION') || 'courseflix-dev';

    this.logger.log(
      `Connecting to ChromaDB at ${chromaUrl}, collection: ${collectionName}`,
    );

    this.client = new ChromaClient({ path: chromaUrl });
    this.collection = await this.client.getOrCreateCollection({
      name: collectionName,
      embeddingFunction: explicitEmbeddingsOnly,
    });

    return this.collection;
  }

  /**
   * Validates metadata and upserts document chunk embeddings into ChromaDB.
   *
   * Vector ID format: `${documentId}:${version}:${chunkIndex}`
   *
   * @throws Error if any required metadata field (courseId, documentId, version, chunkIndex, page) is missing.
   */
  async upsert(items: ChromaUpsertInput[]): Promise<void> {
    if (items.length === 0) {
      return;
    }

    const ids: string[] = [];
    const embeddings: number[][] = [];
    const metadatas: ChromaChunkMetadata[] = [];
    const documents: string[] = [];

    for (const item of items) {
      const { chunk, courseId, vector, isActive = true } = item;

      // Mandatory metadata validation before calling Chroma
      this.validateMetadata({
        courseId,
        documentId: chunk.documentId,
        version: chunk.version,
        chunkIndex: chunk.chunkIndex,
        page: chunk.page,
      });

      const vectorId = `${chunk.documentId}:${chunk.version}:${chunk.chunkIndex}`;

      ids.push(vectorId);
      embeddings.push(vector);
      documents.push(chunk.text);
      metadatas.push({
        courseId,
        documentId: chunk.documentId,
        version: chunk.version,
        chunkIndex: chunk.chunkIndex,
        page: chunk.page,
        isActive,
      });
    }

    const payload = {
      ids,
      embeddings,
      metadatas,
      documents,
    };

    await this.upsertWithRetry(payload);

    this.logger.log(
      `Successfully upserted ${ids.length} vector chunks into ChromaDB`,
    );
  }

  private async upsertWithRetry(
    payload: Parameters<Collection['upsert']>[0],
  ): Promise<void> {
    const collection = await this.getCollection();

    try {
      await collection.upsert(payload);
      return;
    } catch (error) {
      if (!isChromaNotFoundError(error)) {
        throw error;
      }

      this.logger.warn('Chroma collection handle was stale; reconnecting');
      this.collection = null;
      const refreshedCollection = await this.getCollection();
      await refreshedCollection.upsert(payload);
    }
  }

  /**
   * Validates that all mandatory fields are present and defined.
   * Throws an explicit Error if any metadata field is missing.
   */
  private validateMetadata(fields: {
    courseId: string | null | undefined;
    documentId: string | null | undefined;
    version: number | null | undefined;
    chunkIndex: number | null | undefined;
    page: number | null | undefined;
  }): void {
    if (!fields.courseId || typeof fields.courseId !== 'string') {
      throw new Error(
        'Chroma metadata validation failed: courseId is required and must be a string',
      );
    }
    if (!fields.documentId || typeof fields.documentId !== 'string') {
      throw new Error(
        'Chroma metadata validation failed: documentId is required and must be a string',
      );
    }
    if (
      fields.version === undefined ||
      fields.version === null ||
      typeof fields.version !== 'number'
    ) {
      throw new Error(
        'Chroma metadata validation failed: version is required and must be a number',
      );
    }
    if (
      fields.chunkIndex === undefined ||
      fields.chunkIndex === null ||
      typeof fields.chunkIndex !== 'number'
    ) {
      throw new Error(
        'Chroma metadata validation failed: chunkIndex is required and must be a number',
      );
    }
    if (
      fields.page === undefined ||
      fields.page === null ||
      typeof fields.page !== 'number'
    ) {
      throw new Error(
        'Chroma metadata validation failed: page is required and must be a number',
      );
    }
  }
}
