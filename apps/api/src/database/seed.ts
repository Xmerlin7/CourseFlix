import AppDataSource from './data-source';
import { runSeed, printSeedSummary } from './seed-runner';

/**
 * Central seed runner (`npm run seed` in apps/api). Resets to the same
 * demo fixture every time it's run: two teachers, ten students, seven
 * courses (covering every status and both school stages) with sections and
 * lessons, enrollments fanned across them, one playable video per lesson,
 * document rows in every processing status, and a notification feed per
 * user.
 *
 * Every step upserts, so running it twice in a row produces the same state
 * (sprint2-plan.md §12). Run migrations first (`npm run migration:run`).
 *
 * The actual seeding logic lives in `seed-runner.ts` so `reset.ts` (and
 * `reset-check.ts`) share the exact same fixture instead of a second copy
 * that can drift.
 */
async function run(): Promise<void> {
  await AppDataSource.initialize();

  try {
    const summary = await runSeed(AppDataSource);
    printSeedSummary(summary, 'Seed complete:');
  } finally {
    await AppDataSource.destroy();
  }
}

run().catch((error) => {
  console.error('Seed failed:', error);
  process.exitCode = 1;
});
