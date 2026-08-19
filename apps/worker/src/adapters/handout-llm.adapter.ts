import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export const HANDOUT_LLM_PROVIDER = Symbol('HANDOUT_LLM_PROVIDER');

export type HandoutBlockType = 'heading' | 'paragraph' | 'bullet' | 'formula';

export interface HandoutBlock {
  type: HandoutBlockType;
  text: string;
}

export interface HandoutSection {
  title: string;
  blocks: HandoutBlock[];
}

export interface HandoutGenerateInput {
  prompt: string;
  /** Section count the prompt asked for — used by the mock to match it. */
  pageCount: number;
  lessonTitle: string;
}

export interface HandoutGenerateResult {
  subtitle: string;
  sections: HandoutSection[];
  modelName: string;
  provider: string;
  tokensUsed: number;
}

export interface HandoutLlmProvider {
  generateHandout(input: HandoutGenerateInput): Promise<HandoutGenerateResult>;
}

/**
 * Deterministic, offline handout writer for local dev and tests without
 * an API key — mirrors `MockExamLlmProvider`. It produces exactly the
 * requested number of sections with well-formed blocks, so the rest of
 * the pipeline (PDF rendering, ingestion, review, publish) can be
 * exercised end to end without a real LLM call.
 */
export class MockHandoutLlmProvider implements HandoutLlmProvider {
  generateHandout(input: HandoutGenerateInput): Promise<HandoutGenerateResult> {
    const sections: HandoutSection[] = [];

    for (let index = 0; index < input.pageCount; index++) {
      sections.push({
        title: `(تجريبي) المحور ${index + 1} من درس ${input.lessonTitle}`,
        blocks: [
          {
            type: 'heading',
            text: 'الفكرة الأساسية',
          },
          {
            type: 'paragraph',
            text: 'ده نص تجريبي مولّد محليًا من غير نموذج ذكاء اصطناعي حقيقي، عشان باقي خط الوكلاء يتجرب كامل من الرفع لحد النشر.',
          },
          {
            type: 'bullet',
            text: 'نقطة أولى مستخرجة من شرح الدرس.',
          },
          {
            type: 'bullet',
            text: 'نقطة تانية بتوضح تطبيق عملي على الفكرة.',
          },
        ],
      });
    }

    return Promise.resolve({
      subtitle: `مذكّرة شرح مولّدة تلقائيًا لدرس "${input.lessonTitle}"`,
      sections,
      modelName: 'mock-courseflix-handout',
      provider: 'mock',
      tokensUsed: Math.max(1, Math.ceil(input.prompt.length / 4)),
    });
  }
}

interface OpenAIResponsePayload {
  output_text?: string;
  output?: Array<{
    type?: string;
    content?: Array<{ type?: string; text?: string }>;
  }>;
  usage?: { total_tokens?: number };
}

interface HandoutJson {
  subtitle?: unknown;
  sections?: unknown;
}

const VALID_BLOCK_TYPES: readonly HandoutBlockType[] = [
  'heading',
  'paragraph',
  'bullet',
  'formula',
];

/**
 * Real handout writer, same OpenAI Responses API shape as
 * `exam-llm.adapter.ts`'s `OpenAIExamLlmProvider`.
 *
 * A handout is far longer than an exam, so `max_output_tokens` is raised
 * accordingly — a truncated response would surface as a parse failure,
 * which is the one failure mode worth spending tokens to avoid here.
 */
@Injectable()
export class OpenAIHandoutLlmProvider implements HandoutLlmProvider {
  private readonly logger = new Logger(OpenAIHandoutLlmProvider.name);

  constructor(private readonly configService: ConfigService) {}

  async generateHandout(
    input: HandoutGenerateInput,
  ): Promise<HandoutGenerateResult> {
    const apiKey =
      this.configService.get<string>('OPENAI_API_KEY') ||
      this.configService.get<string>('LLM_API_KEY');
    const model = this.configService.get<string>('LLM_MODEL') || 'gpt-5.6';

    if (!apiKey || apiKey === 'replace-me') {
      throw new Error(
        'OPENAI_API_KEY is not configured. Set a valid API key or use MockHandoutLlmProvider.',
      );
    }

    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        input: [
          {
            role: 'system',
            content:
              'Return only compact JSON with "subtitle" and "sections" keys, no prose, no markdown fences.',
          },
          { role: 'user', content: input.prompt },
        ],
        max_output_tokens: 12000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `OpenAI handout generation failed with status ${response.status}: ${errorText}`,
      );
    }

    const payload = (await response.json()) as OpenAIResponsePayload;
    const text = this.extractOutputText(payload);
    const parsed = this.parseJson(text);

    return {
      subtitle:
        typeof parsed.subtitle === 'string' && parsed.subtitle.trim()
          ? parsed.subtitle.trim()
          : `مذكّرة شرح درس "${input.lessonTitle}"`,
      sections: this.normalizeSections(parsed.sections),
      modelName: model,
      provider: 'openai',
      tokensUsed: payload.usage?.total_tokens ?? 0,
    };
  }

  /**
   * Coerces whatever the model returned into the shape the PDF writer
   * can draw, dropping anything unusable rather than throwing: a single
   * malformed block shouldn't cost the teacher the whole handout. An
   * entirely unusable response yields zero sections, which the agent
   * treats as a failure with a message the teacher can act on.
   */
  private normalizeSections(raw: unknown): HandoutSection[] {
    if (!Array.isArray(raw)) return [];

    const sections: HandoutSection[] = [];
    for (const item of raw) {
      if (!item || typeof item !== 'object') continue;
      const candidate = item as { title?: unknown; blocks?: unknown };
      const title =
        typeof candidate.title === 'string' ? candidate.title.trim() : '';
      if (!title) continue;

      const blocks: HandoutBlock[] = [];
      if (Array.isArray(candidate.blocks)) {
        for (const blockItem of candidate.blocks) {
          if (!blockItem || typeof blockItem !== 'object') continue;
          const block = blockItem as { type?: unknown; text?: unknown };
          const text = typeof block.text === 'string' ? block.text.trim() : '';
          if (!text) continue;
          const type = VALID_BLOCK_TYPES.includes(
            block.type as HandoutBlockType,
          )
            ? (block.type as HandoutBlockType)
            : 'paragraph';
          blocks.push({ type, text });
        }
      }

      if (blocks.length === 0) continue;
      sections.push({ title, blocks });
    }

    return sections;
  }

  private extractOutputText(payload: OpenAIResponsePayload): string {
    if (payload.output_text) {
      return payload.output_text;
    }
    return (
      payload.output
        ?.flatMap((item) => item.content ?? [])
        .map((content) => content.text)
        .filter((text): text is string => Boolean(text))
        .join('\n')
        .trim() ?? ''
    );
  }

  private parseJson(text: string): HandoutJson {
    try {
      return JSON.parse(text) as HandoutJson;
    } catch {
      const match = text.match(/\{[\s\S]*\}/);
      if (!match) {
        return {};
      }
      try {
        return JSON.parse(match[0]) as HandoutJson;
      } catch {
        return {};
      }
    }
  }
}
