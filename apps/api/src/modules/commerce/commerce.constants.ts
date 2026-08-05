export const DEFAULT_CURRENCY = 'EGP';

// Africa/Cairo is the display timezone for all commerce timestamps
// (sprint3-plan.md §5 A-1). The API still returns UTC ISO-8601 strings
// plus this field so clients render them in the right local zone.
export const DISPLAY_TIMEZONE = 'Africa/Cairo';

const FALLBACK_COURSE_PRICE_MINOR = 50000;

function readCoursePriceMinor(): number {
  const parsed = Number(process.env.COURSE_PRICE_MINOR);
  return Number.isInteger(parsed) && parsed > 0
    ? parsed
    : FALLBACK_COURSE_PRICE_MINOR;
}

/**
 * Server-side deterministic price, in EGP minor units (1/100 EGP).
 * schemaV2.sql has no per-course pricing, so the test checkout uses a
 * single server-set price — the client can never send price or currency.
 */
export const COURSE_PRICE_MINOR = readCoursePriceMinor();
