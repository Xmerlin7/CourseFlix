import AppDataSource from './data-source';
import { COURSE_BLUEPRINTS } from './seeds/course.seed';
import { DOCUMENT_BLUEPRINTS } from './seeds/document.seed';

/**
 * Read-only gate (`npm run reset:check` in apps/api) — sprint3-plan.md E-2.
 *
 * Verifies the database matches the deterministic demo fixture without
 * modifying anything, so it's safe to call from a release checklist right
 * before E2E. Exits non-zero with a specific list of problems on drift.
 *
 * Scope: full blueprint-value verification for `documents` — the one
 * fixture known to drift, since a rehearsal "retry" click mutates
 * `processing_status`/`version`/`error_message` in place (see
 * `document.seed.ts`). Courses are checked by exact slug set, since that's
 * cheap and exported already. Every other seeded table (users, lessons,
 * enrollments, videos, notifications) only gets a non-zero existence
 * check — those seed functions upsert-if-missing but never correct
 * drifted values, so an exact-count check there would fail for reasons
 * unrelated to the actual documented risk.
 *
 * `orders` and `agent_logs` get the opposite check: `reset` clears them
 * outright rather than upserting (see `transactional-reset.seed.ts`), so a
 * non-zero count here means rehearsal drift, not a missing fixture.
 */
async function run(): Promise<void> {
  AppDataSource.setOptions({ logging: [] });
  await AppDataSource.initialize();

  let problems: string[];
  try {
    problems = [
      ...(await checkCourses()),
      ...(await checkDocuments()),
      ...(await checkNonZero(
        `SELECT count(*)::text AS count FROM users WHERE role = 'teacher' AND deleted_at IS NULL`,
        'teacher',
      )),
      ...(await checkNonZero(
        `SELECT count(*)::text AS count FROM users WHERE role = 'student' AND deleted_at IS NULL`,
        'student',
      )),
      ...(await checkNonZero(
        `SELECT count(*)::text AS count FROM lessons WHERE deleted_at IS NULL`,
        'lesson',
      )),
      ...(await checkNonZero(
        `SELECT count(*)::text AS count FROM enrollments WHERE deleted_at IS NULL`,
        'enrollment',
      )),
      ...(await checkNonZero(
        `SELECT count(*)::text AS count FROM videos WHERE deleted_at IS NULL`,
        'video',
      )),
      ...(await checkNonZero(
        `SELECT count(*)::text AS count FROM notifications WHERE deleted_at IS NULL`,
        'notification',
      )),
      ...(await checkZero(
        `SELECT count(*)::text AS count FROM orders`,
        'order',
      )),
      ...(await checkZero(
        `SELECT count(*)::text AS count FROM agent_logs`,
        'agent log',
      )),
    ];
  } finally {
    await AppDataSource.destroy();
  }

  if (problems.length > 0) {
    console.error(
      'reset:check FAILED — database has drifted from the demo fixture:',
    );
    for (const problem of problems) {
      console.error(`  - ${problem}`);
    }
    console.error(
      `\n${problems.length} problem(s) found. Run \`npm run reset -w apps/api\` to restore the fixture.`,
    );
    process.exitCode = 1;
    return;
  }

  console.log(
    'reset:check passed — database matches the deterministic demo fixture.',
  );
}

async function checkCourses(): Promise<string[]> {
  const rows = await AppDataSource.query<Array<{ slug: string }>>(
    `SELECT slug FROM courses WHERE deleted_at IS NULL`,
  );
  const actualSlugs = new Set(rows.map((row) => row.slug));
  const expectedSlugs = COURSE_BLUEPRINTS.map((blueprint) => blueprint.slug);

  const problems: string[] = [];
  const missing = expectedSlugs.filter((slug) => !actualSlugs.has(slug));
  if (missing.length > 0) {
    problems.push(`missing seeded course(s): ${missing.join(', ')}`);
  }
  if (actualSlugs.size !== expectedSlugs.length) {
    problems.push(
      `expected exactly ${expectedSlugs.length} seeded courses, found ${actualSlugs.size}`,
    );
  }
  return problems;
}

async function checkDocuments(): Promise<string[]> {
  const teacherEmail = requireEnv('SEED_TEACHER_EMAIL');
  const primarySlug = COURSE_BLUEPRINTS[0].slug;

  const teacherRows = await AppDataSource.query<Array<{ id: string }>>(
    `SELECT id FROM users WHERE lower(email) = lower($1) AND deleted_at IS NULL`,
    [teacherEmail],
  );
  if (teacherRows.length === 0) {
    return [
      `primary seed teacher "${teacherEmail}" not found — has seed ever run?`,
    ];
  }

  const courseRows = await AppDataSource.query<Array<{ id: string }>>(
    `SELECT id FROM courses WHERE slug = $1 AND deleted_at IS NULL`,
    [primarySlug],
  );
  if (courseRows.length === 0) {
    return [`primary seed course "${primarySlug}" not found`];
  }
  const courseId = courseRows[0].id;

  // Scoped to this course's fixture file names only — the course can
  // legitimately carry other, non-fixture documents too (a teacher
  // uploading real material during a rehearsal), so this checks that the
  // known fixture rows are present and correct, not that the course has
  // exactly N documents in total.
  const docRows = await AppDataSource.query<
    Array<{
      file_name: string;
      processing_status: string;
      version: number | string;
      error_message: string | null;
    }>
  >(
    `SELECT file_name, processing_status, version, error_message
       FROM documents
      WHERE course_id = $1 AND deleted_at IS NULL`,
    [courseId],
  );
  const byFileName = new Map(docRows.map((row) => [row.file_name, row]));

  const problems: string[] = [];

  for (const blueprint of DOCUMENT_BLUEPRINTS) {
    const row = byFileName.get(blueprint.fileName);
    if (!row) {
      problems.push(`document "${blueprint.fileName}" is missing`);
      continue;
    }
    if (row.processing_status !== blueprint.status) {
      problems.push(
        `document "${blueprint.fileName}" processing_status is "${row.processing_status}", expected "${blueprint.status}"`,
      );
    }
    if (Number(row.version) !== blueprint.version) {
      problems.push(
        `document "${blueprint.fileName}" version is ${row.version}, expected ${blueprint.version}`,
      );
    }
    if ((row.error_message ?? null) !== blueprint.errorMessage) {
      problems.push(
        `document "${blueprint.fileName}" error_message does not match its blueprint`,
      );
    }
  }

  return problems;
}

async function checkNonZero(sql: string, label: string): Promise<string[]> {
  const rows = await AppDataSource.query<Array<{ count: string }>>(sql);
  const count = Number(rows[0]?.count ?? 0);
  return count > 0
    ? []
    : [`expected at least one seeded ${label} row, found 0`];
}

// Transactional rows (checkout orders, agent logs) have no natural key to
// upsert against — `reset` clears them outright (transactional-reset.seed.ts),
// so any row surviving a reset is rehearsal drift, not a missing fixture.
async function checkZero(sql: string, label: string): Promise<string[]> {
  const rows = await AppDataSource.query<Array<{ count: string }>>(sql);
  const count = Number(rows[0]?.count ?? 0);
  return count === 0
    ? []
    : [`expected zero ${label} rows after reset, found ${count}`];
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

run().catch((error) => {
  console.error('reset:check failed to run:', error);
  process.exitCode = 1;
});
