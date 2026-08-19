import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import fontkit from '@pdf-lib/fontkit';
import {
  PDFDocument,
  PDFFont,
  PDFPage,
  StandardFonts,
  rgb,
  type RGB,
} from 'pdf-lib';
import { hasArabic, splitBidiRuns } from './arabic-text';

/**
 * Renders a course handout as a real, readable A4 PDF.
 *
 * These are not placeholders: the bytes this produces are what the
 * student downloads from "ملفات الدورة", what the admin moderation
 * download returns, and — page for page — the exact text the Tutor's
 * `document_chunks` are built from, so a citation reading "صفحة 3" points
 * at the paragraph actually printed on page 3.
 *
 * Arabic body text is laid out right-to-left through `arabic-text.ts`;
 * Latin fragments inside a line (`F = m · a`) keep their own direction and
 * are drawn with Helvetica, because the vendored Noto Naskh Arabic has no
 * Latin glyphs.
 *
 * Vendored from `apps/api/src/database/seeds/pdf/` rather than imported:
 * the API and worker are separate deployables with no shared package,
 * the same reason `exam-llm.adapter.ts` re-implements the tutor's OpenAI
 * client. The two copies differ only in this docblock and in the PDF
 * metadata written by `buildDocumentPdf` — the seed pins a fixed
 * creation date for checksum stability, while the handout agent stamps
 * the real one, since each generated handout is a genuinely new file.
 */

const A4: [number, number] = [595.28, 841.89];
const MARGIN = 56;
const CONTENT_WIDTH = A4[0] - MARGIN * 2;

const INK = rgb(0.09, 0.1, 0.13);
const MUTED = rgb(0.42, 0.45, 0.5);
const ACCENT = rgb(0.16, 0.36, 0.75);
const RULE = rgb(0.85, 0.87, 0.9);
const PANEL = rgb(0.95, 0.96, 0.98);

export interface PdfBlock {
  /** `heading` opens a section, `formula` is centred and monospaced-ish. */
  type: 'heading' | 'paragraph' | 'formula' | 'bullet';
  text: string;
}

export interface PdfPageSpec {
  /** Printed as the page's section title, and used as the chunk label. */
  title: string;
  blocks: PdfBlock[];
}

export interface PdfDocumentSpec {
  title: string;
  subtitle: string;
  courseTitle: string;
  teacherName: string;
  pages: PdfPageSpec[];
}

interface Fonts {
  arabic: PDFFont;
  arabicBold: PDFFont;
  latin: PDFFont;
  latinBold: PDFFont;
  /** Whether the Arabic face actually has a glyph for a code point. */
  arabicCovers: (codePoint: number) => boolean;
}

/**
 * Where the vendored Noto Naskh faces live at runtime.
 *
 * Normally `dist/pdf/assets`, copied there by the `assets` entry in
 * `nest-cli.json`. That copy is a build step that can silently be out of
 * date — a `nest start --watch` process started before the entry existed
 * keeps serving a `dist` without it — and when it is, the failure lands
 * as a bare `ENOENT` from deep inside font embedding, which says nothing
 * about what to do. So the source tree is checked as a fallback (it is
 * two levels up from `dist/pdf`), and anything else raises a message that
 * names the real problem.
 */
const ASSET_CANDIDATES = [
  join(__dirname, 'assets'),
  join(__dirname, '..', '..', 'src', 'pdf', 'assets'),
];

async function readFontFile(fileName: string): Promise<Buffer> {
  for (const directory of ASSET_CANDIDATES) {
    try {
      return await readFile(join(directory, fileName));
    } catch {
      // Try the next candidate; the throw below reports them all at once.
    }
  }

  throw new Error(
    `Arabic font "${fileName}" not found. The handout PDF cannot be drawn ` +
      `without it. Looked in: ${ASSET_CANDIDATES.join(', ')}. ` +
      `Rebuild the worker (its nest-cli.json copies src/pdf/assets into dist).`,
  );
}

/**
 * Noto Naskh Arabic is an Arabic-only face: it has no Latin letters, and
 * it is also missing a few punctuation marks that legitimately appear
 * inside Arabic prose (`/` in "م/ث", the em dash). Anything it can't draw
 * is silently replaced by .notdef — a hollow box in the output — so every
 * draw goes through a coverage check first and falls back to Helvetica.
 * Characters neither face can encode are dropped rather than thrown on.
 */
const LATIN_FALLBACK_SAFE = /[\u0020-\u007e\u00a0-\u00ff\u2013\u2014\u2018\u2019\u201c\u201d\u2022\u2026]/;

/**
 * Helvetica is a WinAnsi face, so a Greek letter or arrow in a formula
 * (`ΣF = 0 → a = 0`) makes pdf-lib *throw* at draw time rather than
 * degrade. Physics prose reaches for those constantly, so they are
 * transliterated to their conventional ASCII spellings up front instead
 * of being dropped, and the same sanitized string is what the seeded
 * `document_chunks` store — so what the Tutor cites and what the PDF
 * prints stay character-identical.
 */
const SYMBOL_ALIASES: Record<string, string> = {
  'Σ': 'sum', // Σ
  'Δ': 'delta', // Δ
  'δ': 'delta', // δ
  'θ': 'theta', // θ
  'π': 'pi', // π
  'λ': 'lambda', // λ
  'μ': 'mu', // μ
  'Ω': 'ohm', // Ω
  'ρ': 'rho', // ρ
  'ε': 'epsilon', // ε
  'φ': 'phi', // φ
  'ω': 'omega', // ω
  'α': 'alpha', // α
  'β': 'beta', // β
  'γ': 'gamma', // γ
  '→': '->', // →
  '⇒': '=>', // ⇒
  '≈': '~=', // ≈
  '≤': '<=', // ≤
  '≥': '>=', // ≥
  '−': '-', // −
  '√': 'sqrt', // √
  '÷': '/', // ÷
};

/**
 * Applied before measuring and before drawing — both must see the same
 * string or the computed line width won't match what lands on the page.
 */
export function sanitizeForFonts(text: string): string {
  return Array.from(text)
    .map((char) => SYMBOL_ALIASES[char] ?? char)
    .join('');
}

interface Segment {
  text: string;
  latin: boolean;
}

/** Drawn text is measured per run, so every helper needs both fonts. */
function pickFont(fonts: Fonts, rtl: boolean, bold: boolean): PDFFont {
  if (rtl) return bold ? fonts.arabicBold : fonts.arabic;
  return bold ? fonts.latinBold : fonts.latin;
}

/**
 * Splits one already-shaped run into segments by which font can draw
 * them. Latin runs pass straight through; Arabic runs get broken around
 * the handful of characters the Arabic face lacks. Order is preserved, so
 * drawing the segments left to right reproduces the run exactly.
 */
function splitByCoverage(
  text: string,
  fonts: Fonts,
  rtl: boolean,
): Segment[] {
  // A Latin run still has to survive WinAnsi: anything outside it would
  // make pdf-lib throw, so it is filtered here rather than at every call
  // site. `sanitizeForFonts` has already rescued the symbols worth
  // keeping, so whatever is left is genuinely unprintable.
  if (!rtl) {
    return [
      {
        text: Array.from(text)
          .filter((char) => LATIN_FALLBACK_SAFE.test(char))
          .join(''),
        latin: true,
      },
    ];
  }

  const segments: Segment[] = [];
  for (const char of Array.from(text)) {
    const codePoint = char.codePointAt(0) ?? 0;
    const covered = fonts.arabicCovers(codePoint);

    if (!covered && !LATIN_FALLBACK_SAFE.test(char)) continue;

    const latin = !covered;
    const last = segments[segments.length - 1];
    if (last && last.latin === latin) last.text += char;
    else segments.push({ text: char, latin });
  }
  return segments;
}

/**
 * Width of a mixed-direction line, summing each segment under the font it
 * will actually be drawn with — a single `font.widthOfTextAtSize` would
 * either throw on the missing Latin glyphs or silently mis-measure.
 */
function measureLine(
  line: string,
  fonts: Fonts,
  size: number,
  bold: boolean,
): number {
  return splitBidiRuns(sanitizeForFonts(line)).reduce((total, run) => {
    const runFont = pickFont(fonts, run.rtl, bold);
    return (
      total +
      splitByCoverage(run.text, fonts, run.rtl).reduce(
        (width, segment) =>
          width +
          (segment.latin ? pickFont(fonts, false, bold) : runFont)
            .widthOfTextAtSize(segment.text, size),
        0,
      )
    );
  }, 0);
}

/**
 * Greedy word wrap against the real measured width. Words are measured in
 * context (`candidate`) rather than individually, because shaping changes
 * a letter's width depending on its neighbours.
 */
function wrapLines(
  text: string,
  fonts: Fonts,
  size: number,
  maxWidth: number,
  bold = false,
): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = '';

  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (line && measureLine(candidate, fonts, size, bold) > maxWidth) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }

  if (line) lines.push(line);
  return lines.length > 0 ? lines : [''];
}

/**
 * Draws one already-wrapped line. RTL lines start at the right margin and
 * walk left, run by run; LTR lines start at the left.
 */
function drawLine(
  page: PDFPage,
  line: string,
  options: {
    fonts: Fonts;
    size: number;
    y: number;
    color: RGB;
    bold?: boolean;
    align?: 'right' | 'left' | 'center';
    left?: number;
    width?: number;
  },
): void {
  const {
    fonts,
    size,
    y,
    color,
    bold = false,
    align = 'right',
    left = MARGIN,
    width = CONTENT_WIDTH,
  } = options;

  const runs = splitBidiRuns(sanitizeForFonts(line));
  const lineWidth = measureLine(line, fonts, size, bold);

  let cursor: number;
  if (align === 'right') cursor = left + width - lineWidth;
  else if (align === 'center') cursor = left + (width - lineWidth) / 2;
  else cursor = left;

  for (const run of runs) {
    const runFont = pickFont(fonts, run.rtl, bold);
    for (const segment of splitByCoverage(run.text, fonts, run.rtl)) {
      const font = segment.latin ? pickFont(fonts, false, bold) : runFont;
      page.drawText(segment.text, { x: cursor, y, size, font, color });
      cursor += font.widthOfTextAtSize(segment.text, size);
    }
  }
}

/** Text that is drawn in an Arabic-only context still needs a Latin fallback. */
async function loadFonts(document: PDFDocument): Promise<Fonts> {
  document.registerFontkit(fontkit);

  const [regular, bold] = await Promise.all([
    readFontFile('NotoNaskhArabic-Regular.ttf'),
    readFontFile('NotoNaskhArabic-Bold.ttf'),
  ]);

  // The same buffer pdf-lib embeds is read back through fontkit to learn
  // which code points the face actually covers, so `splitByCoverage` can
  // route the rest to Helvetica instead of emitting .notdef boxes.
  const probe = fontkit.create(regular) as {
    glyphForCodePoint: (codePoint: number) => { id: number };
  };
  const coverage = new Map<number, boolean>();

  return {
    arabic: await document.embedFont(regular, { subset: true }),
    arabicBold: await document.embedFont(bold, { subset: true }),
    latin: await document.embedFont(StandardFonts.Helvetica),
    latinBold: await document.embedFont(StandardFonts.HelveticaBold),
    arabicCovers: (codePoint: number): boolean => {
      const cached = coverage.get(codePoint);
      if (cached !== undefined) return cached;
      let covered: boolean;
      try {
        covered = probe.glyphForCodePoint(codePoint).id !== 0;
      } catch {
        covered = false;
      }
      coverage.set(codePoint, covered);
      return covered;
    },
  };
}

function drawCover(
  page: PDFPage,
  spec: PdfDocumentSpec,
  fonts: Fonts,
): void {
  page.drawRectangle({
    x: 0,
    y: A4[1] - 210,
    width: A4[0],
    height: 210,
    color: PANEL,
  });
  page.drawRectangle({
    x: 0,
    y: A4[1] - 214,
    width: A4[0],
    height: 4,
    color: ACCENT,
  });

  drawLine(page, 'CourseFlix', {
    fonts,
    size: 12,
    y: A4[1] - 52,
    color: ACCENT,
    bold: true,
    align: 'left',
  });
  drawLine(page, spec.courseTitle, {
    fonts,
    size: 13,
    y: A4[1] - 52,
    color: MUTED,
  });

  let y = A4[1] - 110;
  for (const line of wrapLines(spec.title, fonts, 26, CONTENT_WIDTH, true)) {
    drawLine(page, line, { fonts, size: 26, y, color: INK, bold: true });
    y -= 34;
  }

  y -= 6;
  for (const line of wrapLines(spec.subtitle, fonts, 12, CONTENT_WIDTH)) {
    drawLine(page, line, { fonts, size: 12, y, color: MUTED });
    y -= 18;
  }

  drawLine(page, `إعداد: ${spec.teacherName}`, {
    fonts,
    size: 11,
    y: A4[1] - 250,
    color: MUTED,
  });

  // Table of contents — makes a multi-section handout navigable, and
  // documents (for whoever opens the file) which page each chunk is on.
  y = A4[1] - 300;
  drawLine(page, 'المحتويات', {
    fonts,
    size: 15,
    y,
    color: INK,
    bold: true,
  });
  y -= 12;
  page.drawLine({
    start: { x: MARGIN, y },
    end: { x: MARGIN + CONTENT_WIDTH, y },
    thickness: 1,
    color: RULE,
  });
  y -= 24;

  for (const [index, pageSpec] of spec.pages.entries()) {
    drawLine(page, `${index + 1}.  ${pageSpec.title}`, {
      fonts,
      size: 12,
      y,
      color: INK,
    });
    drawLine(page, `صفحة ${index + 2}`, {
      fonts,
      size: 10,
      y,
      color: MUTED,
      align: 'left',
    });
    y -= 22;
  }
}

function drawFooter(
  page: PDFPage,
  fonts: Fonts,
  pageNumber: number,
  total: number,
): void {
  page.drawLine({
    start: { x: MARGIN, y: 52 },
    end: { x: MARGIN + CONTENT_WIDTH, y: 52 },
    thickness: 0.8,
    color: RULE,
  });
  drawLine(page, `صفحة ${pageNumber} من ${total}`, {
    fonts,
    size: 9,
    y: 36,
    color: MUTED,
  });
  drawLine(page, 'CourseFlix', {
    fonts,
    size: 9,
    y: 36,
    color: MUTED,
    align: 'left',
  });
}

/**
 * Builds the PDF bytes for one handout. Each `PdfPageSpec` becomes exactly
 * one printed page (after the cover), which is the invariant the document
 * seed relies on to map a chunk to its `page_number`.
 */
export async function buildDocumentPdf(
  spec: PdfDocumentSpec,
): Promise<Uint8Array> {
  const document = await PDFDocument.create();
  const fonts = await loadFonts(document);

  document.setTitle(spec.title);
  document.setSubject(spec.subtitle);
  document.setAuthor(spec.teacherName);
  document.setCreator('CourseFlix agents');
  document.setProducer('CourseFlix');
  // Real wall-clock time, unlike the seed's pinned date: every handout
  // this writes is a new file for a specific lesson, and re-running the
  // writer after teacher feedback is *supposed* to produce different
  // bytes, so there is no checksum stability to preserve here.
  const now = new Date();
  document.setCreationDate(now);
  document.setModificationDate(now);

  const totalPages = spec.pages.length + 1;

  const cover = document.addPage(A4);
  drawCover(cover, spec, fonts);
  drawFooter(cover, fonts, 1, totalPages);

  for (const [index, pageSpec] of spec.pages.entries()) {
    const page = document.addPage(A4);
    let y = A4[1] - MARGIN - 10;

    drawLine(page, spec.title, {
      fonts,
      size: 9,
      y: A4[1] - 40,
      color: MUTED,
    });

    drawLine(page, pageSpec.title, {
      fonts,
      size: 17,
      y,
      color: INK,
      bold: true,
    });
    y -= 14;
    page.drawLine({
      start: { x: MARGIN, y },
      end: { x: MARGIN + CONTENT_WIDTH, y },
      thickness: 1.4,
      color: ACCENT,
    });
    y -= 30;

    for (const block of pageSpec.blocks) {
      if (block.type === 'heading') {
        y -= 6;
        for (const line of wrapLines(
          block.text,
          fonts,
          13,
          CONTENT_WIDTH,
          true,
        )) {
          drawLine(page, line, {
            fonts,
            size: 13,
            y,
            color: ACCENT,
            bold: true,
          });
          y -= 20;
        }
        y -= 4;
        continue;
      }

      if (block.type === 'formula') {
        const height = 30;
        page.drawRectangle({
          x: MARGIN,
          y: y - height + 18,
          width: CONTENT_WIDTH,
          height,
          color: PANEL,
        });
        drawLine(page, block.text, {
          fonts,
          size: 13,
          y: y - height + 27,
          color: INK,
          bold: true,
          align: 'center',
        });
        y -= height + 14;
        continue;
      }

      if (block.type === 'bullet') {
        const indent = 18;
        const lines = wrapLines(
          block.text,
          fonts,
          11.5,
          CONTENT_WIDTH - indent,
        );
        page.drawCircle({
          x: MARGIN + CONTENT_WIDTH - 4,
          y: y + 4,
          size: 2.4,
          color: ACCENT,
        });
        for (const line of lines) {
          drawLine(page, line, {
            fonts,
            size: 11.5,
            y,
            color: INK,
            width: CONTENT_WIDTH - indent,
          });
          y -= 19;
        }
        y -= 4;
        continue;
      }

      for (const line of wrapLines(block.text, fonts, 11.5, CONTENT_WIDTH)) {
        drawLine(page, line, { fonts, size: 11.5, y, color: INK });
        y -= 19;
      }
      y -= 10;
    }

    drawFooter(page, fonts, index + 2, totalPages);
  }

  return document.save();
}

/**
 * The plain-text form of a page, used as the `document_chunks` text for
 * that page so retrieval is grounded in exactly what the PDF prints.
 */
export function pageToPlainText(pageSpec: PdfPageSpec): string {
  return sanitizeForFonts(
    [
      pageSpec.title,
      ...pageSpec.blocks.map((block) =>
        block.type === 'bullet' ? `- ${block.text}` : block.text,
      ),
    ].join(' '),
  );
}
