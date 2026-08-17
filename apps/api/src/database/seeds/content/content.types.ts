/**
 * The one place a lesson's subject matter is written down.
 *
 * Every AI-facing surface in the app is grounded in this data, so it is
 * authored once here and fanned out by the seeds rather than restated per
 * feature:
 *
 *  - `summary` + `keyPoints` + `formula` become a page of the course's
 *    generated PDF handout, and the `document_chunks` row for that page —
 *    which is what the Tutor retrieves and cites.
 *  - `transcriptCues` become the lesson video's `video_transcripts` /
 *    `video_chunks`, which is what Video Q&A retrieves and cites.
 *  - `questions` become real `questions` / `quizzes` rows, and the bank
 *    the intervention mini-quizzes draw from.
 *
 * Because all of it comes from one record, a student who watches the
 * video, opens the PDF, asks the Tutor and sits the quiz sees the same
 * physics stated consistently — which is the point.
 */

export interface TranscriptCue {
  /** Spoken-style Arabic, as a real caption line would read. */
  text: string;
  startSeconds: number;
  endSeconds: number;
}

export interface LessonQuestion {
  text: string;
  type: 'mcq' | 'true_false';
  options: string[];
  correctAnswer: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface LessonContent {
  /** Matches `LessonEntity.title` exactly — the join key across seeds. */
  lesson: string;
  /** YouTube id, verified public + embeddable + under five minutes. */
  videoId: string;
  /** Real runtime in seconds, read from the video itself. */
  videoDurationSeconds: number;
  /** One paragraph: what this lesson establishes. */
  summary: string;
  /** Short, quotable facts — rendered as bullets in the PDF. */
  keyPoints: string[];
  /** Central relationship, written ASCII-safe (see `pdf-builder.ts`). */
  formula: string;
  /** A fully worked numeric example, stated then solved. */
  workedExample: string;
  transcriptCues: TranscriptCue[];
  questions: LessonQuestion[];
  /**
   * Real student phrasing for this lesson's everyday-phenomenon angle
   * ("ليه العصا بتبان منكسرة في الميه؟"), each paired with a plain-Arabic
   * answer. Optional — only worth authoring for lessons a student is
   * actually likely to ask about informally (visible phenomena, not
   * abstract derivations).
   *
   * Exists because retrieval was checked directly against the real
   * embedding + Chroma pipeline (not assumed): a formally-worded chunk
   * like "الانكسار هو انحناء مسار الضوء..." scored a distance of 1.46–1.60
   * against that exact colloquial question — over `TUTOR_MAX_DISTANCE`'s
   * 1.35 default, so Tutor would have answered "لا تغطي المواد هذا
   * السؤال" despite the PDF covering it. A chunk close to the student's
   * own wording closes that gap; formal chunks alone don't, no matter how
   * finely they're split.
   */
  commonQuestions?: Array<{ question: string; answer: string }>;
}

export interface CourseContent {
  /** Matches `CourseEntity.slug`. */
  slug: string;
  /** Cover art for the course card — a real, reachable image URL. */
  coverImageUrl: string;
  /** Two-sentence blurb for the handout cover page. */
  handoutIntro: string;
  lessons: LessonContent[];
}

/** Spreads three cues evenly across a video's real runtime. */
export function cuesAcross(
  durationSeconds: number,
  texts: string[],
): TranscriptCue[] {
  const slice = Math.floor(durationSeconds / texts.length);
  return texts.map((text, index) => ({
    text,
    startSeconds: index * slice,
    endSeconds:
      index === texts.length - 1 ? durationSeconds : (index + 1) * slice,
  }));
}
