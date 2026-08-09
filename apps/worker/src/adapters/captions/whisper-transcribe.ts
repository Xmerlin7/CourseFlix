import { spawn } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Logger } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { CaptionCue, CaptionsUnavailableError } from './caption-provider';

const TRANSCRIPTIONS_URL = 'https://api.openai.com/v1/audio/transcriptions';

// gpt-4o-mini-transcribe (unlike whisper-1) only accepts `response_format:
// json` — no `verbose_json`, so no per-segment timestamps come back from
// the API itself. Chunking the audio ourselves on fixed time boundaries
// before sending each piece out is what reconstructs timestamped cues —
// see transcribeAudioBytes below. Each chunk is re-encoded to mono 16kHz
// MP3, which also keeps individual uploads small regardless of source
// video length (the old 25MB whole-request cap no longer applies per
// chunk — see MAX_SOURCE_MEDIA_BYTES for the new, much looser sanity cap
// on the *source* download).
const TRANSCRIPTION_MODEL = 'gpt-4o-mini-transcribe';
// Every word inside one chunk shares that chunk's single start/end
// timestamp (see caption-chunk.stage.ts), so this is also the precision
// ceiling on "jump to this moment" citations — 45s balances that against
// making N sequential API calls per video (larger chunks = fewer calls,
// but a citation citing something said early in a long chunk still jumps
// the student to the chunk's start, not the exact sentence).
const CHUNK_SECONDS = 45;

// A sanity cap on the downloaded source file, not the (always-small,
// re-encoded) per-chunk upload — just to stop a pathologically huge file
// from being downloaded and probed indefinitely.
export const MAX_SOURCE_MEDIA_BYTES = 500 * 1024 * 1024;

interface TranscriptionJsonResponse {
  text?: string;
}

const logger = new Logger('WhisperTranscription');

export function resolveOpenAiApiKey(configService: ConfigService): string {
  const apiKey =
    configService.get<string>('OPENAI_API_KEY') ||
    configService.get<string>('EMBEDDING_API_KEY');

  if (!apiKey || apiKey === 'replace-me') {
    throw new CaptionsUnavailableError(
      'OPENAI_API_KEY is not configured; cannot transcribe video.',
    );
  }

  return apiKey;
}

function runFfmpeg(args: string[]): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const child = spawn('ffmpeg', args);
    const chunks: Buffer[] = [];
    let stderr = '';

    child.stdout.on('data', (chunk: Buffer) => chunks.push(chunk));
    child.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString();
    });
    child.on('error', (err) =>
      reject(new CaptionsUnavailableError(`Could not start ffmpeg: ${err.message}`)),
    );
    child.on('close', (code) => {
      if (code !== 0) {
        reject(new CaptionsUnavailableError(`ffmpeg exited with code ${code}: ${stderr.slice(-500)}`));
        return;
      }
      resolve(Buffer.concat(chunks));
    });
  });
}

function probeDurationSeconds(filePath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const child = spawn('ffprobe', [
      '-v',
      'error',
      '-show_entries',
      'format=duration',
      '-of',
      'default=noprint_wrappers=1:nokey=1',
      filePath,
    ]);
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk: Buffer) => {
      stdout += chunk.toString();
    });
    child.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString();
    });
    child.on('error', (err) =>
      reject(new CaptionsUnavailableError(`Could not start ffprobe: ${err.message}`)),
    );
    child.on('close', (code) => {
      const duration = Number.parseFloat(stdout.trim());
      if (code !== 0 || !Number.isFinite(duration) || duration <= 0) {
        reject(
          new CaptionsUnavailableError(
            `ffprobe couldn't read media duration (exit ${code}): ${stderr.slice(-300)}`,
          ),
        );
        return;
      }
      resolve(duration);
    });
  });
}

async function transcribeChunk(chunkBytes: Buffer, apiKey: string): Promise<string> {
  const formData = new FormData();
  formData.append('file', new Blob([new Uint8Array(chunkBytes)], { type: 'audio/mpeg' }), 'chunk.mp3');
  formData.append('model', TRANSCRIPTION_MODEL);
  formData.append('response_format', 'json');

  const response = await fetch(TRANSCRIPTIONS_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}` },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    logger.error(`Transcription failed (${response.status}): ${errorText}`);
    throw new CaptionsUnavailableError(`Transcription failed with status ${response.status}`);
  }

  const result = (await response.json()) as TranscriptionJsonResponse;
  return (result.text ?? '').trim();
}

/**
 * Shared by every `CaptionProvider` that has no captions API to call
 * (local/direct MP4 links, and — since YouTube's unofficial `timedtext`
 * endpoint stopped returning results — YouTube too, via
 * `YoutubeCaptionsAdapter`'s `yt-dlp` audio download). Splits the media
 * into fixed-length chunks with ffmpeg, transcribes each independently,
 * and stamps each with the real timestamp of where it came from — see
 * the module comment above for why that replaces whisper-1's built-in
 * segment timestamps instead of just switching models.
 */
export async function transcribeAudioBytes(
  mediaBytes: Buffer,
  _contentType: string,
  configService: ConfigService,
): Promise<CaptionCue[]> {
  const apiKey = resolveOpenAiApiKey(configService);

  if (mediaBytes.byteLength === 0) {
    throw new CaptionsUnavailableError('Downloaded media was empty.');
  }

  const workDir = await mkdtemp(join(tmpdir(), 'courseflix-transcribe-'));
  const sourcePath = join(workDir, 'source.media');

  try {
    await writeFile(sourcePath, mediaBytes);
    const durationSeconds = await probeDurationSeconds(sourcePath);

    const cues: CaptionCue[] = [];
    for (let start = 0; start < durationSeconds; start += CHUNK_SECONDS) {
      const end = Math.min(start + CHUNK_SECONDS, durationSeconds);
      const chunkBytes = await runFfmpeg([
        '-y',
        '-ss',
        String(start),
        '-t',
        String(end - start),
        '-i',
        sourcePath,
        '-vn',
        '-ac',
        '1',
        '-ar',
        '16000',
        '-f',
        'mp3',
        'pipe:1',
      ]);

      if (chunkBytes.byteLength === 0) {
        continue;
      }

      const text = await transcribeChunk(chunkBytes, apiKey);
      if (text.length > 0) {
        cues.push({ startSeconds: Math.round(start), endSeconds: Math.round(end), text });
      }
    }

    if (cues.length === 0) {
      throw new CaptionsUnavailableError('Transcription returned no text for this video.');
    }

    return cues;
  } finally {
    await rm(workDir, { recursive: true, force: true }).catch(() => {});
  }
}
