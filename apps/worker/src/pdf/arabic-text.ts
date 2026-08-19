/**
 * Direction handling for the PDF generator.
 *
 * This module used to contain a hand-written Arabic shaper: it mapped
 * every letter to its presentation form (U+FE70–U+FEFF) and reversed the
 * run, on the premise that "`pdf-lib` applies no OpenType `GSUB` shaping
 * and no bidi reordering".
 *
 * **That premise is wrong for embedded fonts.** `pdf-lib` encodes text
 * for a fontkit-embedded font through `font.layout()`, and fontkit does
 * both the `GSUB` shaping *and* the right-to-left reordering itself.
 * Handing it an already-shaped, already-reversed string therefore
 * reversed it a second time — which is why every generated handout came
 * out mirrored, word for word. Verified by drawing one string three ways
 * with the vendored Noto Naskh face: raw renders correctly, the old
 * shaped+reversed output renders backwards, and shaped-but-not-reversed
 * renders correctly.
 *
 * So the shaper is gone and raw logical text goes straight to fontkit.
 * What remains is the one thing fontkit can't do here: the vendored Noto
 * Naskh Arabic is an Arabic-only face with no Latin letters and no ASCII
 * punctuation, so a line still has to be split into runs that each get
 * drawn with a font that can actually draw them.
 */

/** Anything that belongs in an Arabic (RTL) run: letters plus Arabic punctuation. */
const ARABIC_RUN_CHAR = /[؀-ۿﭐ-﷿ﹰ-﻿]/;

const ARABIC_LETTER = /[ء-يٱپچڤگ]/;

/**
 * Digits are left-to-right even inside Arabic prose — a quantity is
 * written `20`, never `02`. Letting them ride along inside the Arabic run
 * means fontkit reverses them with it, which turned "20 أوم" into
 * "02 أوم" and "100 فولت" into "001 فولت": not a cosmetic glitch but a
 * wrong number in a study handout. So a digit span opens its own LTR run
 * and is placed as one unit by the visual re-ordering below.
 */
const DIGIT = /[0-9]/;

export interface BidiRun {
  text: string;
  rtl: boolean;
}

/**
 * Splits a mixed line into runs of one direction each, and returns them
 * **in the order they should be drawn** — left to right across the page,
 * so the caller can walk the array advancing its x cursor by each run's
 * measured width.
 *
 * For an RTL line that means the logically-first word ends up last in the
 * array, at the right margin: `الشغل W = F · d المبذول` is drawn as
 * `المبذول`, `W = F · d`, `الشغل`, which reads correctly right-to-left.
 * Ordering *within* an Arabic run is fontkit's job, not this function's.
 *
 * Whitespace is deliberately not carried inside a run: an Arabic run gets
 * reordered by fontkit, which would move a leading/trailing space to the
 * wrong edge and put two spaces on one side of a Latin fragment and none
 * on the other. Runs are trimmed and the gaps re-inserted afterwards, on
 * whichever visual side the original boundary was.
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
    const isLatin = /[A-Za-z]/.test(char) || DIGIT.test(char);

    // Spaces and punctuation take the direction of whatever run is
    // already open. Digits do not — see `DIGIT`.
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
    visual.push({ text: logical[index].raw, rtl: logical[index].rtl });
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
