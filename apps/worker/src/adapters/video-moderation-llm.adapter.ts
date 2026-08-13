import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export const VIDEO_MODERATION_PROVIDER = Symbol('VIDEO_MODERATION_PROVIDER');

export interface VideoModerationInput {
  videoTitle: string;
  courseTitle: string;
  transcriptText: string;
}

export interface VideoModerationResult {
  safe: boolean;
  unsafeReason: string | null;
  onTopic: boolean;
  offTopicReason: string | null;
}

export interface VideoModerationProvider {
  checkCaptions(input: VideoModerationInput): Promise<VideoModerationResult>;
}

const SYSTEM_PROMPT = `You moderate lesson video captions for an Arabic-language physics tutoring platform for school students.
Given the video's title, its course's title, and its caption transcript, decide two things:
1. "safe": false if the transcript contains violent, sexual, hateful, or otherwise inappropriate content for school students — true otherwise.
2. "onTopic": false if the transcript is not educational physics content related to the course — true otherwise. Only evaluated meaningfully when "safe" is true.
Respond with ONLY compact JSON, no prose, no markdown fences: {"safe": boolean, "unsafeReason": string|null, "onTopic": boolean, "offTopicReason": string|null}.
Reasons must be short, in Arabic, and null when the corresponding check passed.`;

/**
 * Deterministic offline check for local dev/tests without an API key —
 * mirrors MockExamLlmProvider/MockEmbeddingProvider elsewhere. Flags
 * content only via magic substrings so the reject path is exercisable
 * without a real LLM call.
 */
export class MockVideoModerationProvider implements VideoModerationProvider {
  checkCaptions(input: VideoModerationInput): Promise<VideoModerationResult> {
    const text = input.transcriptText.toLowerCase();

    if (text.includes('__unsafe_test__')) {
      return Promise.resolve({
        safe: false,
        unsafeReason: 'محتوى غير لائق (تجريبي)',
        onTopic: true,
        offTopicReason: null,
      });
    }
    if (text.includes('__offtopic_test__')) {
      return Promise.resolve({
        safe: true,
        unsafeReason: null,
        onTopic: false,
        offTopicReason: 'المحتوى لا يتعلق بمادة الفيزياء (تجريبي)',
      });
    }

    return Promise.resolve({
      safe: true,
      unsafeReason: null,
      onTopic: true,
      offTopicReason: null,
    });
  }
}

interface OpenAIResponsePayload {
  output_text?: string;
  output?: Array<{
    type?: string;
    content?: Array<{ type?: string; text?: string }>;
  }>;
}

/**
 * Real video-caption moderation provider, same OpenAI Responses API shape
 * as `OpenAIExamLlmProvider` — duplicated rather than shared because the
 * API and worker are separate deployable apps with no shared package.
 */
@Injectable()
export class OpenAIVideoModerationProvider implements VideoModerationProvider {
  private readonly logger = new Logger(OpenAIVideoModerationProvider.name);

  constructor(private readonly configService: ConfigService) {}

  async checkCaptions(
    input: VideoModerationInput,
  ): Promise<VideoModerationResult> {
    const apiKey =
      this.configService.get<string>('OPENAI_API_KEY') ||
      this.configService.get<string>('LLM_API_KEY');
    const model = this.configService.get<string>('LLM_MODEL') || 'gpt-5.6';

    if (!apiKey || apiKey === 'replace-me') {
      throw new Error(
        'OPENAI_API_KEY is not configured. Set a valid API key or use MockVideoModerationProvider.',
      );
    }

    const userContent = [
      `Video title: ${input.videoTitle}`,
      `Course title: ${input.courseTitle}`,
      `Transcript:\n${input.transcriptText}`,
    ].join('\n\n');

    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        input: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userContent },
        ],
        max_output_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `OpenAI video moderation failed with status ${response.status}: ${errorText}`,
      );
    }

    const payload = (await response.json()) as OpenAIResponsePayload;
    const text = this.extractOutputText(payload);
    return this.parseResult(text);
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

  private parseResult(text: string): VideoModerationResult {
    const parsed = this.parseJson(text);
    if (!parsed) {
      this.logger.warn(
        `Could not parse moderation JSON from LLM output; failing closed as unsafe. Raw: ${text.slice(0, 200)}`,
      );
      return {
        safe: false,
        unsafeReason: 'تعذر تحليل نتيجة فحص المحتوى',
        onTopic: false,
        offTopicReason: null,
      };
    }

    return {
      safe: parsed.safe !== false,
      unsafeReason:
        typeof parsed.unsafeReason === 'string' ? parsed.unsafeReason : null,
      onTopic: parsed.onTopic !== false,
      offTopicReason:
        typeof parsed.offTopicReason === 'string'
          ? parsed.offTopicReason
          : null,
    };
  }

  private parseJson(text: string): Record<string, unknown> | null {
    try {
      return JSON.parse(text) as Record<string, unknown>;
    } catch {
      const match = text.match(/\{[\s\S]*\}/);
      if (!match) {
        return null;
      }
      try {
        return JSON.parse(match[0]) as Record<string, unknown>;
      } catch {
        return null;
      }
    }
  }
}
