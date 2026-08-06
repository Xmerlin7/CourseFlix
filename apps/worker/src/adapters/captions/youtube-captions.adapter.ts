import { Injectable, Logger } from '@nestjs/common';
import {
  CaptionCue,
  CaptionProvider,
  CaptionsUnavailableError,
  decodeHtmlEntities,
} from './caption-provider';

const TIMEDTEXT_BASE = 'https://www.youtube.com/api/timedtext';

function extractVideoId(videoUrl: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(videoUrl);
  } catch {
    return null;
  }

  const hostname = parsed.hostname.replace(/^www\./, '').toLowerCase();
  if (hostname === 'youtu.be') {
    return parsed.pathname.slice(1) || null;
  }
  if (hostname === 'youtube.com' || hostname === 'm.youtube.com') {
    return (
      parsed.searchParams.get('v') ??
      parsed.pathname.match(/\/embed\/([^/]+)/)?.[1] ??
      null
    );
  }
  return null;
}

function parseTrackList(xml: string): string[] {
  const langCodes: string[] = [];
  const trackPattern = /<track\b[^>]*lang_code="([^"]+)"[^>]*>/g;
  let match: RegExpExecArray | null;
  while ((match = trackPattern.exec(xml)) !== null) {
    langCodes.push(match[1]);
  }
  return langCodes;
}

function parseTranscript(xml: string): CaptionCue[] {
  const cues: CaptionCue[] = [];
  const textPattern =
    /<text start="([\d.]+)" dur="([\d.]+)"[^>]*>([\s\S]*?)<\/text>/g;
  let match: RegExpExecArray | null;
  while ((match = textPattern.exec(xml)) !== null) {
    const [, startRaw, durRaw, rawText] = match;
    const text = decodeHtmlEntities(rawText.replace(/<[^>]+>/g, '')).trim();
    if (!text) {
      continue;
    }
    const start = Number(startRaw);
    const dur = Number(durRaw);
    cues.push({
      startSeconds: Math.round(start),
      endSeconds: Math.round(start + dur),
      text,
    });
  }
  return cues;
}

/**
 * Fetches YouTube's auto-generated or uploader-provided captions via the
 * unofficial `timedtext` endpoint — there is no official public API to
 * read another channel's captions without that channel owner completing
 * an OAuth grant, which this platform's teachers haven't done. This is
 * best-effort: YouTube can change or rate-limit this endpoint without
 * notice, so a failure here surfaces as a normal ingestion failure
 * (`video_transcripts.processing_status = 'failed'`), not a crash.
 */
@Injectable()
export class YoutubeCaptionsAdapter implements CaptionProvider {
  private readonly logger = new Logger(YoutubeCaptionsAdapter.name);

  async fetchCaptions(videoUrl: string): Promise<CaptionCue[]> {
    const videoId = extractVideoId(videoUrl);
    if (!videoId) {
      throw new CaptionsUnavailableError(
        `Could not extract a YouTube video id from ${videoUrl}`,
      );
    }

    const listResponse = await fetch(
      `${TIMEDTEXT_BASE}?type=list&v=${videoId}`,
    );
    if (!listResponse.ok) {
      throw new CaptionsUnavailableError(
        `YouTube caption track list failed with status ${listResponse.status}`,
      );
    }

    const availableLangs = parseTrackList(await listResponse.text());
    if (availableLangs.length === 0) {
      throw new CaptionsUnavailableError(
        `Video ${videoId} has no captions available on YouTube.`,
      );
    }

    const lang =
      availableLangs.find((code) => code === 'ar') ??
      availableLangs.find((code) => code === 'en') ??
      availableLangs[0];

    const transcriptResponse = await fetch(
      `${TIMEDTEXT_BASE}?v=${videoId}&lang=${lang}`,
    );
    if (!transcriptResponse.ok) {
      throw new CaptionsUnavailableError(
        `YouTube transcript fetch failed with status ${transcriptResponse.status}`,
      );
    }

    const cues = parseTranscript(await transcriptResponse.text());
    if (cues.length === 0) {
      throw new CaptionsUnavailableError(
        `Video ${videoId}'s "${lang}" caption track was empty.`,
      );
    }

    return cues;
  }
}
