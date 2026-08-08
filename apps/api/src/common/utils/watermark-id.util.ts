const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Mirrors `getStudentWatermarkId` in
 * `apps/web/src/features/lessons/pages/StudentLessonPage.tsx` — the code
 * burned into a student's video watermark so a leaked recording can be
 * traced back to them. No shared package between web and api, so keep
 * both in sync by hand if this ever changes.
 */
export function deriveWatermarkId(userId: string): string {
  return userId.replace(/-/g, '').slice(0, 10).toUpperCase();
}

export function looksLikeUuid(value: string): boolean {
  return UUID_PATTERN.test(value.trim());
}

/**
 * Same derivation as `deriveWatermarkId`, computed in SQL so a search
 * term can be matched against every row's watermark without loading the
 * whole table into memory first. `columnRef` must be a trusted,
 * hardcoded column reference (e.g. `'user.id'`) — never interpolate
 * caller input here.
 */
export function watermarkSqlExpression(columnRef: string): string {
  return `UPPER(LEFT(REPLACE(${columnRef}::text, '-', ''), 10))`;
}
