import { DataSource } from 'typeorm';
import { CourseEntity } from '../../modules/courses/entities/course.entity';
import { AgentLogEntity } from '../../modules/agent-logs/entities/agent-log.entity';
import type {
  AgentLogStatus,
  AgentType,
} from '../../common/ports/agent-log.port';

interface AgentLogBlueprint {
  /** Natural key this seed upserts against — `agent_logs` has no other. */
  correlationId: string;
  agentType: AgentType;
  action: string;
  status: AgentLogStatus;
  tokensUsed: number | null;
  durationMs: number;
  rowCount: number | null;
  errorMessage: string | null;
  metadata: Record<string, unknown>;
}

/**
 * Seeds a realistic `agent_logs` feed: content ingestion, Tutor answers,
 * and analytics runs, mixing `success`/`failed`/`retrying` so the
 * teacher's Agent Logs viewer (`/teacher/agent-logs`) isn't a wall of
 * identical green rows.
 *
 * `agent_logs` has no natural key to upsert against (see
 * `transactional-reset.seed.ts`'s docblock — it's cleared outright on
 * `reset`, never upserted), so this seed manufactures one: each row's
 * `correlation_id` is a fixed `seed-agent-log-N` marker, checked before
 * insert, making a plain `npm run seed` (no reset) idempotent too.
 */
export async function seedAgentLogs(dataSource: DataSource): Promise<number> {
  const courseRepository = dataSource.getRepository(CourseEntity);
  const agentLogRepository = dataSource.getRepository(AgentLogEntity);

  const primaryCourse = await courseRepository.findOne({
    where: { slug: 'classical-mechanics' },
  });
  const secondCourse = await courseRepository.findOne({
    where: { slug: 'electromagnetism' },
  });

  const blueprints: AgentLogBlueprint[] = [
    {
      correlationId: 'seed-agent-log-1',
      agentType: 'content_scout',
      action: 'ingest_document',
      status: 'success',
      tokensUsed: 4200,
      durationMs: 3120,
      rowCount: 10,
      errorMessage: null,
      metadata: { fileName: `مذكرة ${primaryCourse?.title ?? 'الدورة'}.pdf` },
    },
    {
      correlationId: 'seed-agent-log-2',
      agentType: 'content_scout',
      action: 'ingest_video_transcript',
      status: 'success',
      tokensUsed: 1800,
      durationMs: 2450,
      rowCount: 3,
      errorMessage: null,
      metadata: { provider: 'local' },
    },
    {
      correlationId: 'seed-agent-log-3',
      agentType: 'tutor_llm',
      action: 'generate_answer',
      status: 'success',
      tokensUsed: 950,
      durationMs: 1380,
      rowCount: 1,
      errorMessage: null,
      metadata: { citations: 1 },
    },
    {
      correlationId: 'seed-agent-log-4',
      agentType: 'tutor_llm',
      action: 'generate_answer',
      status: 'retrying',
      tokensUsed: null,
      durationMs: 6100,
      rowCount: null,
      errorMessage: 'Rate limited by upstream provider, retry scheduled.',
      metadata: { attempt: 1 },
    },
    {
      correlationId: 'seed-agent-log-5',
      agentType: 'proactive_proctor',
      action: 'evaluate_signal',
      status: 'success',
      tokensUsed: 320,
      durationMs: 410,
      rowCount: 1,
      errorMessage: null,
      metadata: { rule: 'low_quiz_score' },
    },
    {
      correlationId: 'seed-agent-log-6',
      agentType: 'analytics_agent',
      action: 'compute_sales_summary',
      status: 'success',
      tokensUsed: null,
      durationMs: 210,
      rowCount: 7,
      errorMessage: null,
      metadata: { scope: 'teacher_dashboard' },
    },
    {
      correlationId: 'seed-agent-log-7',
      agentType: 'content_scout',
      action: 'ingest_video_transcript',
      status: 'failed',
      tokensUsed: null,
      durationMs: 890,
      rowCount: 0,
      errorMessage: 'Caption fetch failed: video has no captions track.',
      metadata: { provider: 'youtube' },
    },
    {
      correlationId: 'seed-agent-log-8',
      agentType: 'tutor_llm',
      action: 'generate_answer',
      status: 'skipped',
      tokensUsed: null,
      durationMs: 40,
      rowCount: 0,
      errorMessage: null,
      metadata: { reason: 'no_relevant_chunks' },
    },
  ];

  let created = 0;

  for (const [index, blueprint] of blueprints.entries()) {
    const existing = await agentLogRepository.findOne({
      where: { correlationId: blueprint.correlationId },
    });
    if (existing) continue;

    const course = index % 2 === 0 ? primaryCourse : secondCourse;

    await agentLogRepository.save(
      agentLogRepository.create({
        agentType: blueprint.agentType,
        courseId: course?.id ?? null,
        targetEntityType: 'course',
        targetEntityId: course?.id ?? null,
        action: blueprint.action,
        status: blueprint.status,
        tokensUsed: blueprint.tokensUsed,
        durationMs: blueprint.durationMs,
        rowCount: blueprint.rowCount,
        correlationId: blueprint.correlationId,
        metadata: blueprint.metadata,
        errorMessage: blueprint.errorMessage,
      }),
    );
    created += 1;
  }

  return created;
}
