import type { CaptionCue } from '../adapters/captions/caption-provider';

// chunk.stage.ts's DEFAULT_CHUNK_TOKENS (800 words) is sized for dense PDF
// pages — reused here unchanged, a short video's whole transcript (a few
// hundred words) fit in a single window, so every citation pointed at the
// same "0:00, full transcript" chunk no matter what was actually asked.
// Video citations are a "jump to roughly this moment" feature, so they
// need much finer granularity: ~60 words is roughly 20-30s of spoken
// Arabic at a normal pace, with a short overlap so a sentence split across
// a window boundary still has surrounding context in at least one chunk.
export const DEFAULT_VIDEO_CHUNK_WORDS = 60;
export const DEFAULT_VIDEO_CHUNK_WORD_OVERLAP = 15;

export interface ChunkCaptionsOptions {
  videoTranscriptId: string;
  version: number;
  cues: CaptionCue[];
  chunkTokens?: number;
  chunkOverlap?: number;
}

export interface VideoChunk {
  videoTranscriptId: string;
  version: number;
  chunkIndex: number;
  startSeconds: number;
  endSeconds: number;
  text: string;
  tokenCount: number;
}

interface TimedToken {
  word: string;
  startSeconds: number;
  endSeconds: number;
}

/**
 * Same deterministic overlapping-window strategy as
 * `chunk.stage.ts#chunkDocument`, but windowing over caption cues
 * instead of PDF pages — each chunk carries the start/end timestamp of
 * the cues it spans instead of a page number.
 */
export function chunkCaptions(options: ChunkCaptionsOptions): VideoChunk[] {
  const { videoTranscriptId, version, cues } = options;
  const chunkTokens = options.chunkTokens ?? DEFAULT_VIDEO_CHUNK_WORDS;
  const chunkOverlap = options.chunkOverlap ?? DEFAULT_VIDEO_CHUNK_WORD_OVERLAP;

  if (chunkTokens <= 0) {
    throw new Error('chunkTokens must be greater than 0');
  }
  if (chunkOverlap < 0 || chunkOverlap >= chunkTokens) {
    throw new Error(
      'chunkOverlap must be non-negative and less than chunkTokens',
    );
  }

  const tokens: TimedToken[] = [];
  for (const cue of cues) {
    const words = cue.text.trim().split(/\s+/).filter(Boolean);
    for (const word of words) {
      tokens.push({
        word,
        startSeconds: cue.startSeconds,
        endSeconds: cue.endSeconds,
      });
    }
  }

  const step = chunkTokens - chunkOverlap;
  const chunks: VideoChunk[] = [];
  let chunkIndex = 0;

  for (let start = 0; start < tokens.length; start += step) {
    const windowTokens = tokens.slice(start, start + chunkTokens);
    if (windowTokens.length === 0) {
      continue;
    }

    chunks.push({
      videoTranscriptId,
      version,
      chunkIndex: chunkIndex++,
      startSeconds: windowTokens[0].startSeconds,
      endSeconds: windowTokens[windowTokens.length - 1].endSeconds,
      text: windowTokens.map((token) => token.word).join(' '),
      tokenCount: windowTokens.length,
    });
  }

  return chunks;
}
