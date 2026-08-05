import AppDataSource from './data-source';
import { runSeed, printSeedSummary } from './seed-runner';

/**
 * Deterministic reset (`npm run reset` in apps/api) — sprint3-plan.md E-2.
 *
 * Restores the database to the same demo fixture `seed.ts` produces,
 * including forcing any rehearsal drift back to blueprint values (e.g. a
 * document whose `processing_status` was flipped by clicking "retry" in a
 * demo run). Calls the exact same `runSeed()` as `seed.ts` — there is one
 * fixture definition, not two copies that can disagree.
 *
 * Safe to run repeatedly against the same database: every step upserts,
 * and `seedDocuments` additionally corrects drifted rows, so two
 * consecutive runs report the same steady-state summary and never create
 * duplicate rows. Run migrations first (`npm run migration:run`); pair
 * with `npm run reset:check` as a read-only gate before E2E/release.
 */
async function run(): Promise<void> {
  AppDataSource.setOptions({ logging: [] });
  await AppDataSource.initialize();

  try {
    const summary = await runSeed(AppDataSource, {
      resetTransactionalState: true,
    });
    printSeedSummary(summary, 'Reset complete:');
  } finally {
    await AppDataSource.destroy();
  }
}

run().catch((error) => {
  console.error('Reset failed:', error);
  process.exitCode = 1;
});
