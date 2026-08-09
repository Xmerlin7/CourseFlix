import { ConfigService } from '@nestjs/config';
import { ChromaClient } from 'chromadb';
import { DataSource } from 'typeorm';
import { OpenAIEmbeddingProvider } from '../../modules/retrieval/embedding.adapter';
import { VIDEO_SOURCES } from './video.seed';

interface VideoRow {
  id: string;
  course_id: string;
  section_id: string;
  lesson_id: string;
  title: string;
}

const SAMPLE_TRANSCRIPTS: Record<
  string,
  Array<{ text: string; startSeconds: number; endSeconds: number }>
> = {
  default: [
    {
      text: 'مرحباً بكم في هذا الفيديو التعليمي. سنشرح اليوم المبادئ والقوانين الأساسية لهذا الدرس وتطبيقاتها العملية والرياضية.',
      startSeconds: 0,
      endSeconds: 15,
    },
    {
      text: 'المفهوم الأول يتناول الشحنات والقوى المؤثرة بين الأجسام، وكيفية حساب القوة الناتجة وتحديد اتجاهها باستخدام المعادلات الفيزيائية.',
      startSeconds: 16,
      endSeconds: 35,
    },
    {
      text: 'ننتقل الآن لحل مثال تطبيقي على المفهوم الأساسي في الدرس، ونوضح خطوات الحل والوحدات المستخدمة للوصول إلى النتيجة الصحيحة.',
      startSeconds: 36,
      endSeconds: 60,
    },
  ],
  'قانون كولوم': [
    {
      text: 'مرحباً بكم في درس قانون كولوم. يصف هذا القانون القوة الكهرومغناطيسية المتبادلة بين الشحنات الكهربائية النقطية في الفراغ أو الوسط الفاصل.',
      startSeconds: 0,
      endSeconds: 20,
    },
    {
      text: 'ينص قانون كولوم على أن مقدار القوة الكهربائية المتبادلة بين شحنتين تناسب طردياً مع حاصل ضرب الشحنتين وعكسياً مع مربع المسافة بينهما.',
      startSeconds: 21,
      endSeconds: 45,
    },
    {
      text: 'الصيغة الرياضية للقانون هي: F = k * (|q1 * q2|) / r^2، حيث k هو ثابت كولوم ويساوي تقريباً 8.99 × 10^9 نيوتن م2/كولوم2.',
      startSeconds: 46,
      endSeconds: 70,
    },
    {
      text: 'تكون القوة الكهربائية قوة تجاذب إذا كانت الشحنتان مختلفتين في الإشارة (موجبة وسالبة)، وقوة تنافر إذا كانت الشحنتان متشابهتين (موجبتان أو سالبتان).',
      startSeconds: 71,
      endSeconds: 95,
    },
  ],
  'شدة المجال الكهربي': [
    {
      text: 'في هذا الدرس سنتعرف على مفهوم شدة المجال الكهربي ونقطة التأثير في الفراغ المحيط بشحنة مصدرية.',
      startSeconds: 0,
      endSeconds: 25,
    },
    {
      text: 'يقاس المجال الكهربي بالقوة المؤثرة على وحدة الشحنات الموجبة الموضوعة عند تلك النقطة، ووحدته هي نيوتن لكل كولوم (N/C) أو فولت لكل متر (V/m).',
      startSeconds: 26,
      endSeconds: 50,
    },
  ],
  'الشغل والطاقة': [
    {
      text: 'نبدأ شرح مفهوم الشغل في الفيزياء والطاقة الحركية وطاقة الوضع ونظرية الشغل والطاقة.',
      startSeconds: 0,
      endSeconds: 30,
    },
    {
      text: 'الشغل المبدول يساوي حاصل ضرب القوة المطبقة في الإزاحة في جيب تمام الزاوية بينهما: W = F * d * cos(theta)، وتقاس الطاقة بالشول.',
      startSeconds: 31,
      endSeconds: 60,
    },
  ],
};

// Only these MDN placeholder clips (see video.seed.ts's VIDEO_SOURCES) are
// ours to overwrite with canned demo transcripts. Every other video row is
// something a real teacher/student pointed at a real YouTube/Bunny/direct
// URL — its transcript belongs to VideoIngestionService's real pipeline,
// never to this seed. Previously this ran unfiltered and clobbered a real,
// in-progress (or already-successful) transcript on every `./dev.sh`
// restart, since setup_database() reseeds on every run.
const SEED_VIDEO_URLS = new Set(VIDEO_SOURCES.map((source) => source.url));

export async function seedVideoTranscripts(dataSource: DataSource): Promise<number> {
  const videos = (await dataSource.query(
    `SELECT id, course_id, section_id, lesson_id, title, video_url FROM videos
      WHERE video_url = ANY($1::text[])`,
    [Array.from(SEED_VIDEO_URLS)],
  )) as Array<VideoRow & { video_url: string }>;

  if (videos.length === 0) {
    console.log('No videos found for transcript seeding.');
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

  for (const video of videos) {
    // Check or upsert transcript row
    const existingTranscripts = (await dataSource.query(
      `SELECT id FROM video_transcripts WHERE video_id = $1`,
      [video.id],
    )) as Array<{ id: string }>;

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
      const inserted = (await dataSource.query(
        `INSERT INTO video_transcripts (
          video_id, course_id, section_id, lesson_id, provider, processing_status, version
        ) VALUES ($1, $2, $3, $4, 'local', 'completed', 1)
        RETURNING id`,
        [video.id, video.course_id, video.section_id, video.lesson_id],
      )) as Array<{ id: string }>;
      transcriptId = inserted[0].id;
    }

    // Determine cue chunks
    const cueChunks =
      SAMPLE_TRANSCRIPTS[video.title] || SAMPLE_TRANSCRIPTS['default'];

    // Delete existing video_chunks for this transcript
    await dataSource.query(
      `DELETE FROM video_chunks WHERE video_transcript_id = $1`,
      [transcriptId],
    );

    const texts: string[] = [];
    const ids: string[] = [];
    const metadatas: Array<Record<string, string | number | boolean>> = [];

    for (let index = 0; index < cueChunks.length; index++) {
      const cue = cueChunks[index];
      const vectorId = `video:${transcriptId}:1:${index}`;

      await dataSource.query(
        `INSERT INTO video_chunks (
          video_transcript_id, chunk_index, text_preview, vector_id, start_seconds, end_seconds, token_count, is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, true)`,
        [
          transcriptId,
          index,
          cue.text,
          vectorId,
          cue.startSeconds,
          cue.endSeconds,
          Math.ceil(cue.text.length / 4),
        ],
      );

      texts.push(cue.text);
      ids.push(vectorId);
      metadatas.push({
        courseId: video.course_id,
        videoTranscriptId: transcriptId,
        chunkIndex: index,
        startSeconds: cue.startSeconds,
        isActive: true,
      });
    }

    // Embed and upsert to ChromaDB
    const embeddings = await embeddingProvider.embed(texts);

    await collection.upsert({
      ids,
      embeddings,
      documents: texts,
      metadatas,
    });

    seededCount++;
  }

  console.log(`Seeded transcripts and embeddings for ${seededCount} videos.`);
  return seededCount;
}
