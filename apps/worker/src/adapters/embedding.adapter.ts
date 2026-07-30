import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export const EMBEDDING_PROVIDER = Symbol('EMBEDDING_PROVIDER');

export interface EmbeddingProvider {
  embed(texts: string[]): Promise<number[][]>;
}

/**
 * Deterministic Mock Embedding Provider for testing and offline environments.
 * Generates 1536-dimensional float vectors based on deterministic hashing of input text.
 * NEVER makes external HTTP calls or hits paid APIs.
 */
@Injectable()
export class MockEmbeddingProvider implements EmbeddingProvider {
  private static readonly VECTOR_DIMENSION = 1536;

  embed(texts: string[]): Promise<number[][]> {
    return Promise.resolve(
      texts.map((text) => this.generateDeterministicVector(text)),
    );
  }

  private generateDeterministicVector(text: string): number[] {
    let seed = 5381;
    for (let i = 0; i < text.length; i++) {
      seed = (seed * 33) ^ text.charCodeAt(i);
    }

    const vector: number[] = [];
    for (let i = 0; i < MockEmbeddingProvider.VECTOR_DIMENSION; i++) {
      // Generate deterministic floats between -1.0 and 1.0
      const val = Math.sin(seed + i * 0.1);
      vector.push(Math.round(val * 100000) / 100000);
    }
    return vector;
  }
}

/**
 * Real OpenAI Embedding Provider.
 * Calls OpenAI API (or compatible REST endpoint) using fetch.
 */
@Injectable()
export class OpenAIEmbeddingProvider implements EmbeddingProvider {
  private readonly logger = new Logger(OpenAIEmbeddingProvider.name);

  constructor(private readonly configService: ConfigService) {}

  async embed(texts: string[]): Promise<number[][]> {
    const apiKey = this.configService.get<string>('EMBEDDING_API_KEY');
    const model =
      this.configService.get<string>('EMBEDDING_MODEL') ||
      'text-embedding-3-small';

    if (!apiKey || apiKey === 'replace-me') {
      throw new Error(
        'EMBEDDING_API_KEY is not configured. Set a valid API key or use MockEmbeddingProvider.',
      );
    }

    if (texts.length === 0) {
      return [];
    }

    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        input: texts,
        model,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      this.logger.error(
        `OpenAI embedding failed (${response.status}): ${errorText}`,
      );
      throw new Error(
        `OpenAI embedding failed with status ${response.status}: ${errorText}`,
      );
    }

    const data = (await response.json()) as {
      data: Array<{ embedding: number[]; index: number }>;
    };

    // Sort by original index to preserve array ordering
    return data.data
      .sort((a, b) => a.index - b.index)
      .map((item) => item.embedding);
  }
}
