import { ConfigService } from '@nestjs/config';
import { ChromaClient } from 'chromadb';
import { DataSource } from 'typeorm';
import { OpenAIEmbeddingProvider } from '../../modules/retrieval/embedding.adapter';
import { findLessonContent } from './content';

interface VideoRow {
  id: string;
  course_id: string;
  section_id: string;
  lesson_id: string;
  title: string;
  video_url: string;
  course_slug: string;
}

/**
 * Seeds `video_transcripts` + `video_chunks` (+ their Chroma vectors) for
 * every lesson video, from the real transcript cues authored in
 * `seeds/content/`.
 *
 * These are the exact cues a caption pass over the real YouTube video
 * would produce for the drill that video covers — not filler — so Video
 * Q&A (`video-qa.service.ts`) has genuine grounded content to retrieve
 * and cite for every single lesson, not just a handful of MDN clips.
 *
 * Real videos a teacher/student adds later (not from this seed's
 * content) are untouched: this only writes transcripts for videos whose
 * `lessonId` resolves to a `LessonContent` entry, so it never clobbers
 * the worker's real ingestion pipeline for anything outside the fixture.
 *
 * Safe to run on every reseed: upserts the transcript row by `video_id`,
 * and always resets its chunks to match content (undoing any rehearsal
 * drift), mirroring `document.seed.ts`'s reset posture.
 */
export async function seedVideoTranscripts(
  dataSource: DataSource,
): Promise<number> {
  const videos = await dataSource.query<VideoRow[]>(
    `SELECT v.id, v.course_id, v.section_id, v.lesson_id, v.title, v.video_url,
            c.slug AS course_slug
       FROM videos v
       JOIN courses c ON c.id = v.course_id
      WHERE v.deleted_at IS NULL`,
  );

  const withContent = videos.filter((video) =>
    findLessonContent(video.course_slug, video.title),
  );

  if (withContent.length === 0) {
    console.log('No content-backed videos found for transcript seeding.');
    return 0;
  }

  const configService = new ConfigService();
  const embeddingProvider = new OpenAIEmbeddingProvider(configService);

  const chromaUrl = process.env.CHROMA_URL || 'http://localhost:8000';
  const collectionName = process.env.CHROMA_COLLECTION || 'courseflix-dev';

  const client = new ChromaClient({ path: chromaUrl });
  const collection = await client.getOrCreateCollection({
    name: collectionName,
    embeddingFunction: {
      name: 'courseflix-explicit-embeddings',
      async generate() {
        throw new Error('CourseFlix passes embeddings explicitly');
      },
    },
  });

  let seededCount = 0;

  for (const video of withContent) {
    const content = findLessonContent(video.course_slug, video.title);
    if (!content) continue;

    try {
      const existingTranscripts = await dataSource.query<
        Array<{ id: string }>
      >(`SELECT id FROM video_transcripts WHERE video_id = $1`, [video.id]);

      let transcriptId: string;

      if (existingTranscripts.length > 0) {
        transcriptId = existingTranscripts[0].id;
        await dataSource.query(
          `UPDATE video_transcripts
              SET processing_status = 'completed',
                  provider = 'local',
                  error_message = NULL,
                  version = 1
            WHERE id = $1`,
          [transcriptId],
        );
      } else {
        const inserted = await dataSource.query<Array<{ id: string }>>(
          `INSERT INTO video_transcripts (
            video_id, course_id, section_id, lesson_id, provider, processing_status, version
          ) VALUES ($1, $2, $3, $4, 'local', 'completed', 1)
          RETURNING id`,
          [video.id, video.course_id, video.section_id, video.lesson_id],
        );
        transcriptId = inserted[0].id;
      }

      const cues = content.transcriptCues;
      const texts = cues.map((cue) => cue.text);
      const ids = cues.map((_cue, index) => `video:${transcriptId}:1:${index}`);
      const metadatas = cues.map((cue, index) => ({
        courseId: video.course_id,
        videoTranscriptId: transcriptId,
        chunkIndex: index,
        startSeconds: cue.startSeconds,
        isActive: true,
      }));

      // Embed and upsert to ChromaDB *before* touching Postgres — a
      // failed embedding call here leaves the previous transcript/chunks
      // untouched instead of deleted-and-never-replaced.
      const embeddings = await embeddingProvider.embed(texts);
      await collection.upsert({ ids, embeddings, documents: texts, metadatas });

      await dataSource.query(
        `DELETE FROM video_chunks WHERE video_transcript_id = $1`,
        [transcriptId],
      );
      for (const [index, cue] of cues.entries()) {
        await dataSource.query(
          `INSERT INTO video_chunks (
            video_transcript_id, chunk_index, text_preview, vector_id, start_seconds, end_seconds, token_count, is_active
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, true)`,
          [
            transcriptId,
            index,
            cue.text,
            ids[index],
            cue.startSeconds,
            cue.endSeconds,
            Math.ceil(cue.text.length / 4),
          ],
        );
      }

      seededCount++;
    } catch (error) {
      // Best-effort, like the video-transcript backfill dev.sh runs right
      // after this seed: one video's embedding call failing (rate limit,
      // network) shouldn't corrupt its existing data or abort seeding for
      // every other video.
      console.warn(
        `Skipped transcript seeding for video ${video.id} (${video.title}): ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  console.log(`Seeded transcripts and embeddings for ${seededCount} videos.`);
  return seededCount;
}
