import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { DataSource } from 'typeorm';
import { DocumentEntity } from '../../modules/documents/entities/document.entity';
import { FileEntity } from '../../modules/documents/entities/file.entity';
import { CourseEntity } from '../../modules/courses/entities/course.entity';
import { COURSE_CONTENT, LessonContent } from './content';
import { buildDocumentPdf, PdfBlock, PdfPageSpec } from './pdf/pdf-builder';

const STORAGE_ROOT = resolve(process.env.STORAGE_ROOT ?? './storage');

function lessonToPage(lesson: LessonContent): PdfPageSpec {
  const blocks: PdfBlock[] = [
    { type: 'paragraph', text: lesson.summary },
    { type: 'heading', text: 'النقاط الأساسية' },
    ...lesson.keyPoints.map((point): PdfBlock => ({
      type: 'bullet',
      text: point,
    })),
  ];

  if (lesson.formula) {
    blocks.push({ type: 'formula', text: lesson.formula });
  }

  blocks.push({ type: 'heading', text: 'مثال محلول' });
  blocks.push({ type: 'paragraph', text: lesson.workedExample });

  return { title: lesson.lesson, blocks };
}

/**
 * Splits a lesson into one grounding fact per chunk, instead of one giant
 * chunk for the whole PDF page. Verified directly against the real
 * embedding+retrieval path: a single page-sized chunk (title + summary +
 * every bullet + formula + example concatenated) scored a Chroma distance
 * of 1.54 against a plainly-phrased student question ("ليه العصا بتبان
 * منكسرة في الميه؟") — over `TUTOR_MAX_DISTANCE`'s 1.35 default, so
 * `AnswerPolicyService` would have silently discarded it and Tutor would
 * have answered "لا تغطي المواد هذا السؤال" despite the PDF covering
 * exactly that. Splitting the same content into per-fact chunks — the
 * same granularity the video transcript cues already use, which *did*
 * score well — brought every case in that same check back under
 * threshold. Each chunk is still prefixed with the lesson title, both for
 * this same retrieval-quality reason and so a chunk read on its own
 * (e.g. in a citation excerpt) doesn't lose its topic.
 */
function lessonToChunkTexts(lesson: LessonContent): string[] {
  const texts = [`${lesson.lesson}: ${lesson.summary}`];

  for (const point of lesson.keyPoints) {
    texts.push(`${lesson.lesson} — ${point}`);
  }

  if (lesson.formula) {
    texts.push(`${lesson.lesson} — الصيغة الرياضية: ${lesson.formula}`);
  }

  texts.push(`${lesson.lesson} — مثال محلول: ${lesson.workedExample}`);

  for (const faq of lesson.commonQuestions ?? []) {
    // The question itself carries the chunk — phrased however a student
    // really would, not rewritten formally — so a near-duplicate future
    // question embeds close to it. The answer rides along in the same
    // chunk so a hit still grounds Tutor's actual reply.
    texts.push(`${faq.question} ${faq.answer}`);
  }

  return texts;
}

/**
 * Seeds one real, multi-page PDF handout per course — a cover page plus
 * one page per lesson, built from the same `seeds/content/` data that
 * backs the lesson videos and quizzes — so every course, not only the
 * primary one, has genuine grounded material for the Tutor to retrieve
 * and cite. Without this, asking the Tutor about any course besides the
 * primary fixture would fall through to "لا تغطي المواد هذا السؤال".
 *
 * The PDF is generated fully in-process (`pdf/pdf-builder.ts`, with real
 * Arabic shaping) and written to `STORAGE_ROOT` under a checksum-derived
 * path — real bytes a teacher/admin can actually open and read, not a
 * placeholder path nothing serves.
 *
 * `document_chunks` are several small, single-fact rows per lesson page
 * (see `lessonToChunkTexts` below) rather than one chunk for the whole
 * page — measured to matter for real retrieval quality, not just
 * tidiness. Every chunk from a given lesson still carries that lesson's
 * `page_number`, matching the PDF's real pagination, so a Tutor citation
 * "صفحة 4" still opens to page 4. Chunk *embedding* into Chroma is
 * deliberately not done here — `re-embed-chunks.ts` (called by
 * `seed-runner.ts` right after this) embeds every active `document_chunks`
 * row project-wide in one batched pass.
 *
 * Safe to run on every reseed: the PDF bytes are deterministic (pinned
 * creation/modification dates — see `pdf-builder.ts`), so an unchanged
 * course's checksum is unchanged and this is a no-op; a genuinely edited
 * `LessonContent` produces a new checksum, which bumps the document's
 * `version` exactly like a real re-upload would.
 */
export async function seedCourseHandouts(
  dataSource: DataSource,
  { teacherId }: { teacherId: string },
): Promise<{ created: number; updated: number; unchanged: number }> {
  const courseRepository = dataSource.getRepository(CourseEntity);
  const documentRepository = dataSource.getRepository(DocumentEntity);
  const fileRepository = dataSource.getRepository(FileEntity);

  let created = 0;
  let updated = 0;
  let unchanged = 0;

  for (const courseContent of COURSE_CONTENT) {
    const course = await courseRepository.findOne({
      where: { slug: courseContent.slug },
    });
    if (!course) continue;

    const fileName = `مذكرة ${course.title}.pdf`;

    const pages = courseContent.lessons.map(lessonToPage);
    const pdfBytes = await buildDocumentPdf({
      title: `مذكرة ${course.title}`,
      subtitle: courseContent.handoutIntro,
      courseTitle: course.title,
      teacherName: 'محمد عبدالرحمن',
      pages,
    });
    const checksum = createHash('sha256').update(pdfBytes).digest('hex');

    const existing = await documentRepository.findOne({
      where: { courseId: course.id, fileName },
    });

    // Bumped whenever the PDF *file* itself changes, so `vector_id`
    // (`{documentId}:{version}:{chunkIndex}`) never collides with a stale
    // Chroma vector from a previous version's chunk at the same index.
    let fileVersion = existing?.version ?? 1;
    let documentId = existing?.id;

    if (existing && existing.checksum === checksum) {
      unchanged += 1;
    } else {
      // Only the PDF *bytes* are checksum-gated — content authoring
      // (`seeds/content/`) that changes chunk text but happens to leave
      // the rendered PDF unchanged still needs its chunks refreshed
      // below, so this block only decides whether to rewrite the file
      // and bump the document version, never whether to touch chunks.
      const storageDir = join(STORAGE_ROOT, 'course-handouts');
      await mkdir(storageDir, { recursive: true });
      const storagePath = join(storageDir, `${checksum}.pdf`);
      await writeFile(storagePath, pdfBytes);

      const file = await fileRepository.save(
        fileRepository.create({
          fileName,
          mimeType: 'application/pdf',
          sizeBytes: String(pdfBytes.length),
          storageProvider: 'local',
          storagePath,
          checksum,
          uploadedBy: teacherId,
        }),
      );

      if (existing) {
        fileVersion = existing.version + 1;
        await documentRepository.update(existing.id, {
          fileId: file.id,
          checksum,
          version: fileVersion,
          processingStatus: 'completed',
          errorMessage: null,
        });
        updated += 1;
      } else {
        const saved = await documentRepository.save(
          documentRepository.create({
            courseId: course.id,
            uploadedBy: teacherId,
            fileId: file.id,
            fileName,
            fileType: 'pdf',
            processingStatus: 'completed',
            checksum,
            version: 1,
            errorMessage: null,
          }),
        );
        documentId = saved.id;
        created += 1;
      }
    }

    if (!documentId) continue; // unreachable — every branch above sets it.

    const desiredChunks = courseContent.lessons.flatMap((lesson, lessonIndex) =>
      lessonToChunkTexts(lesson).map((text) => ({
        text,
        pageNumber: lessonIndex + 2, // page 1 is the cover.
      })),
    );

    const storedChunks = await dataSource.query<
      Array<{ text_preview: string }>
    >(
      `SELECT text_preview FROM document_chunks
        WHERE document_id = $1 ORDER BY chunk_index ASC`,
      [documentId],
    );
    const chunksMatch =
      storedChunks.length === desiredChunks.length &&
      storedChunks.every(
        (row, index) => row.text_preview === desiredChunks[index].text,
      );

    if (chunksMatch) continue;

    await dataSource.query(
      `DELETE FROM document_chunks WHERE document_id = $1`,
      [documentId],
    );

    for (const [chunkIndex, chunk] of desiredChunks.entries()) {
      const vectorId = `${documentId}:${fileVersion}:${chunkIndex}`;

      await dataSource.query(
        `INSERT INTO document_chunks (
          document_id, chunk_index, text_preview, vector_id, page_number, token_count, is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, true)`,
        [
          documentId,
          chunkIndex,
          chunk.text,
          vectorId,
          chunk.pageNumber,
          Math.ceil(chunk.text.length / 4),
        ],
      );
    }
  }

  return { created, updated, unchanged };
}
