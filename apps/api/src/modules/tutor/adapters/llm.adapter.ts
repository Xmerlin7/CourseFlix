import type { RetrievedChunk } from '../../../common/ports/retrieval.port';

export const LLM_PROVIDER = Symbol('LLM_PROVIDER');

export interface LlmGenerateInput {
  prompt: string;
  question: string;
  chunks: RetrievedChunk[];
}

export interface LlmGenerateResult {
  answer: string;
  citedChunkIds: string[];
  modelName: string;
  provider: string;
  tokensUsed: number;
}

export interface LlmProvider {
  generateAnswer(input: LlmGenerateInput): Promise<LlmGenerateResult>;
}

export class MockLlmProvider implements LlmProvider {
  async generateAnswer(input: LlmGenerateInput): Promise<LlmGenerateResult> {
    const firstChunk = input.chunks[0];
    return {
      answer: `حسب المادة المرفوعة: ${firstChunk.excerpt}`,
      citedChunkIds: firstChunk ? [firstChunk.chunkId] : [],
      modelName: 'mock-courseflix-tutor',
      provider: 'mock',
      tokensUsed: Math.max(1, Math.ceil(input.prompt.length / 4)),
    };
  }
}
