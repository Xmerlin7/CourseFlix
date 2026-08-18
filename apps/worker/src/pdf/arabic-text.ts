/**
 * Minimal Arabic text shaper for the seed's PDF generator.
 *
 * `pdf-lib` draws a string glyph-by-glyph in the order given: it applies
 * no OpenType `GSUB` shaping and no bidi reordering. Handing it raw
 * Arabic therefore produces disconnected letters printed left-to-right —
 * unreadable. Real text layout engines solve this with HarfBuzz; pulling
 * one in for a fixture generator is not worth it, so this module does the
 * two things Arabic actually needs:
 *
 *  1. **Joining** — map each Arabic letter to its isolated / initial /
 *     medial / final presentation form (U+FE70–U+FEFF) based on whether
 *     its neighbours join, plus the mandatory lam-alef ligatures. The
 *     vendored Noto Naskh Arabic covers that whole block (verified with
 *     fontkit before this file was written).
 *  2. **Ordering** — reverse the shaped run so drawing it left-to-right
 *     renders right-to-left.
 *
 * Latin/digit/formula runs (`F = m × a`) must keep their own direction and
 * their own font, so `splitBidiRuns` hands them back untouched and the
 * caller draws each run with the right font. Non-spacing marks (tashkeel)
 * are dropped rather than mis-positioned — the fixture text doesn't use
 * them, and a wrongly-placed mark reads worse than none.
 */

/** [isolated, final, initial, medial] — `null` where the form doesn't exist. */
const FORMS: Record<string, [number, number, number | null, number | null]> = {
  'ء': [0xfe80, 0xfe80, null, null], // ء
  'آ': [0xfe81, 0xfe82, null, null], // آ
  'أ': [0xfe83, 0xfe84, null, null], // أ
  'ؤ': [0xfe85, 0xfe86, null, null], // ؤ
  'إ': [0xfe87, 0xfe88, null, null], // إ
  'ئ': [0xfe89, 0xfe8a, 0xfe8b, 0xfe8c], // ئ
  'ا': [0xfe8d, 0xfe8e, null, null], // ا
  'ب': [0xfe8f, 0xfe90, 0xfe91, 0xfe92], // ب
  'ة': [0xfe93, 0xfe94, null, null], // ة
  'ت': [0xfe95, 0xfe96, 0xfe97, 0xfe98], // ت
  'ث': [0xfe99, 0xfe9a, 0xfe9b, 0xfe9c], // ث
  'ج': [0xfe9d, 0xfe9e, 0xfe9f, 0xfea0], // ج
  'ح': [0xfea1, 0xfea2, 0xfea3, 0xfea4], // ح
  'خ': [0xfea5, 0xfea6, 0xfea7, 0xfea8], // خ
  'د': [0xfea9, 0xfeaa, null, null], // د
  'ذ': [0xfeab, 0xfeac, null, null], // ذ
  'ر': [0xfead, 0xfeae, null, null], // ر
  'ز': [0xfeaf, 0xfeb0, null, null], // ز
  'س': [0xfeb1, 0xfeb2, 0xfeb3, 0xfeb4], // س
  'ش': [0xfeb5, 0xfeb6, 0xfeb7, 0xfeb8], // ش
  'ص': [0xfeb9, 0xfeba, 0xfebb, 0xfebc], // ص
  'ض': [0xfebd, 0xfebe, 0xfebf, 0xfec0], // ض
  'ط': [0xfec1, 0xfec2, 0xfec3, 0xfec4], // ط
  'ظ': [0xfec5, 0xfec6, 0xfec7, 0xfec8], // ظ
  'ع': [0xfec9, 0xfeca, 0xfecb, 0xfecc], // ع
  'غ': [0xfecd, 0xfece, 0xfecf, 0xfed0], // غ
  'ـ': [0x0640, 0x0640, 0x0640, 0x0640], // ـ (tatweel)
  'ف': [0xfed1, 0xfed2, 0xfed3, 0xfed4], // ف
  'ق': [0xfed5, 0xfed6, 0xfed7, 0xfed8], // ق
  'ك': [0xfed9, 0xfeda, 0xfedb, 0xfedc], // ك
  'ل': [0xfedd, 0xfede, 0xfedf, 0xfee0], // ل
  'م': [0xfee1, 0xfee2, 0xfee3, 0xfee4], // م
  'ن': [0xfee5, 0xfee6, 0xfee7, 0xfee8], // ن
  'ه': [0xfee9, 0xfeea, 0xfeeb, 0xfeec], // ه
  'و': [0xfeed, 0xfeee, null, null], // و
  'ى': [0xfeef, 0xfef0, null, null], // ى
  'ي': [0xfef1, 0xfef2, 0xfef3, 0xfef4], // ي
  'ٱ': [0xfb50, 0xfb51, null, null], // ٱ
  'پ': [0xfb56, 0xfb57, 0xfb58, 0xfb59], // پ
  'چ': [0xfb7a, 0xfb7b, 0xfb7c, 0xfb7d], // چ
  'ڤ': [0xfb6a, 0xfb6b, 0xfb6c, 0xfb6d], // ڤ
  'گ': [0xfb92, 0xfb93, 0xfb94, 0xfb95], // گ
};

/** Lam + alef collapse into a single mandatory ligature glyph. */
const LAM_ALEF: Record<string, [number, number]> = {
  'آ': [0xfef5, 0xfef6], // لآ
  'أ': [0xfef7, 0xfef8], // لأ
  'إ': [0xfef9, 0xfefa], // لإ
  'ا': [0xfefb, 0xfefc], // لا
};

/** Combining marks (tashkeel, superscript alef) — dropped, see the file docblock. */
const TASHKEEL = /[ً-ٰٟۖ-ۭ]/g;

const ARABIC_LETTER = /[ء-يٱپچڤگ]/;
/** Anything that belongs in an Arabic (RTL) run: letters plus Arabic punctuation. */
const ARABIC_RUN_CHAR = /[؀-ۿﭐ-﷿ﹰ-﻿]/;

/**
 * Mirrored characters: in an RTL run the glyph is reversed along with the
 * text, so an opening bracket must be swapped for its closing twin to
 * still look like it opens the phrase.
 */
const MIRRORED: Record<string, string> = {
  '(': ')',
  ')': '(',
  '[': ']',
  ']': '[',
  '{': '}',
  '}': '{',
  '<': '>',
  '>': '<',
};

function joinsToNext(char: string | undefined): boolean {
  if (!char) return false;
  const forms = FORMS[char];
  return Boolean(forms && forms[2] !== null);
}

function joinsToPrevious(char: string | undefined): boolean {
  if (!char) return false;
  return Boolean(FORMS[char]);
}

/**
 * Characters that keep their own left-to-right order even inside an
 * Arabic sentence: a quantity is written `500`, never `005`, and a unit
 * or symbol borrowed from Latin reads forwards. A maximal span of these
 * is emitted as a single token so the RTL reversal moves the span as a
 * unit instead of scrambling it.
 */
const LTR_NEUTRAL = /[0-9A-Za-z]/;
const LTR_JOINER = /[.,:/%^+\-=<>×·°]/;

/**
 * Rewrites an Arabic string into presentation forms and reverses it, so
 * drawing the result left-to-right renders correct, connected RTL text.
 */
export function shapeArabic(input: string): string {
  const chars = Array.from(input.replace(TASHKEEL, ''));
  const out: string[] = [];

  for (let index = 0; index < chars.length; index += 1) {
    const char = chars[index];

    // Numbers/symbols travel as one token, so reversing the line moves
    // the whole span rather than its individual characters.
    if (LTR_NEUTRAL.test(char)) {
      let span = char;
      let ahead = index + 1;
      while (
        ahead < chars.length &&
        (LTR_NEUTRAL.test(chars[ahead]) ||
          // A separator only stays inside the span when a digit/letter
          // follows it — trailing punctuation belongs to the sentence.
          (LTR_JOINER.test(chars[ahead]) &&
            ahead + 1 < chars.length &&
            LTR_NEUTRAL.test(chars[ahead + 1])))
      ) {
        span += chars[ahead];
        ahead += 1;
      }
      out.push(span);
      index = ahead - 1;
      continue;
    }

    // Lam-alef must be handled before the generic path: the pair maps to
    // one glyph, so it also consumes the alef.
    if (char === 'ل' && LAM_ALEF[chars[index + 1] ?? '']) {
      const [isolated, final] = LAM_ALEF[chars[index + 1]];
      const previous = chars[index - 1];
      out.push(
        String.fromCharCode(
          joinsToNext(previous) && joinsToPrevious(char) ? final : isolated,
        ),
      );
      index += 1;
      continue;
    }

    const forms = FORMS[char];
    if (!forms) {
      out.push(MIRRORED[char] ?? char);
      continue;
    }

    const [isolated, final, initial, medial] = forms;
    // A letter takes a connected form when its *previous* letter can join
    // forward, and an opening form when it can itself join forward to a
    // letter that accepts a connection.
    const linkedBefore = joinsToNext(chars[index - 1]);
    const linkedAfter = initial !== null && joinsToPrevious(chars[index + 1]);

    let form: number;
    if (linkedBefore && linkedAfter) form = medial ?? final;
    else if (linkedBefore) form = final;
    else if (linkedAfter) form = initial ?? isolated;
    else form = isolated;

    out.push(String.fromCharCode(form));
  }

  return out.reverse().join('');
}

export interface BidiRun {
  text: string;
  rtl: boolean;
}

/**
 * Splits a mixed line into runs of one direction each, shaping the Arabic
 * ones, and returns them **in the order they should be drawn** — left to
 * right across the page, so the caller can walk the array advancing its x
 * cursor by each run's measured width.
 *
 * For an RTL line that means the logically-first word ends up last in the
 * array, at the right margin: `الشغل W = F · d المبذول` is drawn as
 * `المبذول`, `W = F · d`, `الشغل`, which reads correctly right-to-left.
 *
 * Whitespace is deliberately not carried inside a run: reversing an
 * Arabic run would move its spaces to the wrong edge, putting two spaces
 * on one side of a Latin fragment and none on the other. Runs are trimmed
 * and the gaps re-inserted afterwards, on whichever visual side the
 * original boundary was.
 */
export function splitBidiRuns(line: string): BidiRun[] {
  interface LogicalRun {
    raw: string;
    rtl: boolean;
  }

  const logical: LogicalRun[] = [];
  /** `gapAfter[i]` — was there whitespace between logical run i and i+1? */
  const gapAfter: boolean[] = [];

  let current = '';
  let currentRtl: boolean | null = null;

  const flush = (): void => {
    const trimmed = current.trim();
    if (trimmed) logical.push({ raw: trimmed, rtl: currentRtl ?? true });
    current = '';
  };

  for (const char of Array.from(line)) {
    const isArabic = ARABIC_RUN_CHAR.test(char);
    const isLatin = /[A-Za-z]/.test(char);

    // Spaces, digits and punctuation take the direction of whatever run
    // is already open, so `500 جول` stays one Arabic run.
    if (!isArabic && !isLatin) {
      current += char;
      continue;
    }

    if (currentRtl === null || isArabic === currentRtl) {
      currentRtl = isArabic;
      current += char;
      continue;
    }

    // Direction flipped: close the run, remembering whether the two were
    // separated by whitespace, and start the next one.
    const hadGap = /\s$/.test(current);
    flush();
    if (logical.length > 0) gapAfter[logical.length - 1] = hadGap;
    currentRtl = isArabic;
    current = char;
  }
  flush();

  const count = logical.length;
  const visual: BidiRun[] = [];

  for (let index = count - 1; index >= 0; index -= 1) {
    const run = logical[index];
    visual.push({
      text: run.rtl ? shapeArabic(run.raw) : run.raw,
      rtl: run.rtl,
    });
  }

  // Visual run k sits immediately left of visual run k+1, which is
  // logical run (count - 2 - k) and (count - 1 - k) respectively — so the
  // gap between them is the logical gap recorded at (count - 2 - k).
  for (let k = 0; k < visual.length - 1; k += 1) {
    if (gapAfter[count - 2 - k]) visual[k].text += ' ';
  }

  return visual;
}

/** True when the string contains at least one Arabic letter. */
export function hasArabic(text: string): boolean {
  return ARABIC_LETTER.test(text);
}
