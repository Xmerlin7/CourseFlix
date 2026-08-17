import { ChromaClient } from 'chromadb';
import AppDataSource from './data-source';

/**
 * `npm run db:wipe` — destroys every row in every table **except `users`**,
 * and empties the Chroma vector collection.
 *
 * This is not what `./dev.sh` runs on a normal restart (that's `npm run
 * seed`, an idempotent upsert — see `seed-runner.ts`'s docblock). It's a
 * deliberate, once-in-a-while reset for when the fixture itself needs to
 * be rebuilt from scratch rather than patched in place: accounts and
 * their login sessions survive (nobody has to re-register), every course,
 * document, order, discussion, ticket, notification, etc. does not.
 *
 * `sessions` is wiped along with everything else — it isn't the `users`
 * table the user asked to keep, and a stale session pointing at
 * about-to-be-regenerated data is worse than being asked to log back in.
 *
 * Truncates in one statement with `CASCADE` so FK order doesn't matter,
 * and `RESTART IDENTITY` for any future integer sequence even though
 * every table here uses generated UUIDs. Run `npm run seed` right after
 * to repopulate.
 */
const TABLES_TO_WIPE = [
  'agent_logs',
  'ai_jobs',
  'assistant_actions',
  'attendance',
  'chat_message_source_chunks',
  'chat_messages',
  'chat_conversations',
  'content_progress',
  'discussion_helpful_votes',
  'discussion_thread_attachments',
  'discussion_replies',
  'discussion_threads',
  'document_chunks',
  'documents',
  'enrollments',
  'files',
  'intervention_evidence',
  'intervention_mini_quiz_questions',
  'intervention_mini_quizzes',
  'interventions',
  'notifications',
  'order_items',
  'payments',
  'orders',
  'otp_codes',
  'post_attachments',
  'posts',
  'progress_reports',
  'quiz_generation_feedback',
  'quiz_generation_requests',
  'quiz_questions',
  'quiz_submission_answers',
  'quiz_submissions',
  'quizzes',
  'questions',
  'support_ticket_attachments',
  'support_messages',
  'support_tickets',
  'teacher_quotas',
  'video_chunks',
  'video_transcripts',
  'videos',
  'lessons',
  'sections',
  'courses',
  'sessions',
] as const;

async function wipeChroma(): Promise<void> {
  const chromaUrl = process.env.CHROMA_URL || 'http://localhost:8000';
  const collectionName = process.env.CHROMA_COLLECTION || 'courseflix-dev';

  const client = new ChromaClient({ path: chromaUrl });
  try {
    await client.deleteCollection({ name: collectionName });
    console.log(`  chroma:  dropped collection "${collectionName}"`);
  } catch (error) {
    // Nothing to drop on a fresh Chroma instance — not an error.
    console.log(
      `  chroma:  nothing to drop ("${collectionName}" did not exist: ${error instanceof Error ? error.message : String(error)})`,
    );
  }
}

async function run(): Promise<void> {
  await AppDataSource.initialize();

  try {
    console.log(
      `Wiping ${TABLES_TO_WIPE.length} tables (everything except "users")...`,
    );

    await AppDataSource.query(
      `TRUNCATE TABLE ${TABLES_TO_WIPE.join(', ')} RESTART IDENTITY CASCADE`,
    );

    for (const table of TABLES_TO_WIPE) {
      console.log(`  cleared: ${table}`);
    }

    await wipeChroma();

    const [{ count }] = await AppDataSource.query<Array<{ count: string }>>(
      'SELECT count(*)::text AS count FROM users',
    );
    console.log(`\nWipe complete. users preserved: ${count}.`);
    console.log('Run `npm run seed` to repopulate.');
  } finally {
    await AppDataSource.destroy();
  }
}

run().catch((error) => {
  console.error('Wipe failed:', error);
  process.exitCode = 1;
});
