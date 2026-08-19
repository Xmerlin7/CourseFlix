import { Job } from 'bullmq';
import {
  AgentFailure,
  AgentOutcome,
  LessonAgentContext,
} from '../agents/agent-context';
import type { LessonAgentKey } from '../agents/roster';
import {
  LessonAgentsJobPayload,
  LessonAgentsProcessor,
} from './lesson-agents.processor';

type QueryHandler = (sql: string, params?: unknown[]) => unknown;

/**
 * Every agent is a stub here: what this suite pins is the orchestrator's
 * own contract — the order it walks, the handoff events it writes, and
 * the two different things a mandatory versus an optional failure does
 * to the run. The agents' real work is covered by their own paths.
 */
function makeAgent(
  key: LessonAgentKey,
  behaviour?: () => Promise<AgentOutcome>,
) {
  return {
    key,
    run: jest.fn(
      behaviour ??
        (() =>
          Promise.resolve({
            headline: `${key} done`,
            output: { ok: true },
          })),
    ),
  };
}

describe('LessonAgentsProcessor', () => {
  let processor: LessonAgentsProcessor;
  let dataSource: { query: jest.Mock };
  let notificationProducer: { notify: jest.Mock };
  let agents: Record<LessonAgentKey, ReturnType<typeof makeAgent>>;
  let stepStatuses: Record<string, string>;

  const enabledAgents: LessonAgentKey[] = [
    'transcript',
    'reviewer',
    'indexer',
    'handout',
    'quizmaster',
  ];

  /** Rows the fake DB hands back, keyed by the query it recognises. */
  function buildQueryHandler(): QueryHandler {
    return (sql: string, params?: unknown[]) => {
      if (sql.includes('UPDATE ai_jobs') && sql.includes("'processing'")) {
        return [{ id: 'job-1' }];
      }
      if (sql.includes('SELECT target_entity_type, target_entity_id')) {
        return [
          {
            target_entity_type: 'lesson_agent_run',
            target_entity_id: 'run-1',
          },
        ];
      }
      if (sql.includes('FROM lesson_agent_runs WHERE id')) {
        return [
          {
            id: 'run-1',
            lesson_id: 'lesson-1',
            course_id: 'course-1',
            video_id: 'video-1',
            teacher_id: 'teacher-1',
            config: {
              enabledAgents,
              handout: {
                pageCount: 4,
                tone: 'simple',
                includeExamples: true,
                includeKeyTerms: true,
                includeSummary: true,
              },
              quiz: {
                difficulty: 'medium',
                questionCount: 8,
                types: ['mcq'],
                dueInDays: 7,
              },
            },
          },
        ];
      }
      if (sql.includes('FROM lessons WHERE id')) {
        return [
          {
            id: 'lesson-1',
            title: 'الدرس',
            section_id: 'section-1',
            course_id: 'course-1',
          },
        ];
      }
      if (sql.includes('FROM courses WHERE id')) {
        return [{ id: 'course-1', title: 'الدورة', teacher_id: 'teacher-1' }];
      }
      if (sql.includes('FROM videos WHERE')) {
        return [{ id: 'video-1', title: 'فيديو', video_url: 'https://x/y' }];
      }
      if (sql.includes('SELECT id, agent_key FROM lesson_agent_steps')) {
        const key = params?.[1] as LessonAgentKey;
        return [{ id: `step-${key}`, agent_key: key }];
      }
      if (sql.includes('SELECT agent_key, status FROM lesson_agent_steps')) {
        return enabledAgents.map((key) => ({
          agent_key: key,
          status: stepStatuses[key] ?? 'completed',
        }));
      }
      return [];
    };
  }

  /** Every event the run wrote, in order. */
  function recordedEvents(): Array<{
    type: string;
    agentKey: string | null;
    toAgentKey: string | null;
    message: string;
  }> {
    return dataSource.query.mock.calls
      .filter(([sql]: [string]) =>
        sql.includes('INSERT INTO lesson_agent_events'),
      )
      .map(([, params]: [string, unknown[]]) => ({
        agentKey: params[2] as string | null,
        toAgentKey: params[3] as string | null,
        type: params[4] as string,
        message: params[5] as string,
      }));
  }

  function runStatusWrites(): string[] {
    return dataSource.query.mock.calls
      .filter(([sql]: [string]) => sql.includes('UPDATE lesson_agent_runs'))
      .map(([, params]: [string, unknown[]]) => params[1] as string)
      .filter(Boolean);
  }

  function buildProcessor() {
    return new LessonAgentsProcessor(
      dataSource as never,
      { getCollection: jest.fn() } as never,
      agents.transcript as never,
      agents.reviewer as never,
      agents.indexer as never,
      agents.handout as never,
      agents.quizmaster as never,
      notificationProducer,
    );
  }

  beforeEach(() => {
    stepStatuses = {};
    dataSource = { query: jest.fn() };
    dataSource.query.mockImplementation((sql: string, params?: unknown[]) =>
      Promise.resolve(buildQueryHandler()(sql, params)),
    );
    notificationProducer = { notify: jest.fn().mockResolvedValue(undefined) };
    agents = {
      transcript: makeAgent('transcript'),
      reviewer: makeAgent('reviewer'),
      indexer: makeAgent('indexer'),
      handout: makeAgent('handout'),
      quizmaster: makeAgent('quizmaster'),
    };
    processor = buildProcessor();
  });

  const job = (data: LessonAgentsJobPayload) =>
    ({ id: 'bull-1', data }) as Job<LessonAgentsJobPayload>;

  it('runs every enabled agent in roster order', async () => {
    await processor.process(job({ jobId: 'job-1' }));

    for (const key of enabledAgents) {
      expect(agents[key].run).toHaveBeenCalledTimes(1);
    }

    const started = recordedEvents()
      .filter((event) => event.type === 'agent_started')
      .map((event) => event.agentKey);
    expect(started).toEqual(enabledAgents);
  });

  it('writes a handoff event between each consecutive pair of agents', async () => {
    await processor.process(job({ jobId: 'job-1' }));

    const handoffs = recordedEvents()
      .filter((event) => event.type === 'handoff')
      .map((event) => `${event.agentKey}->${event.toAgentKey}`);

    expect(handoffs).toEqual([
      'transcript->reviewer',
      'reviewer->indexer',
      'indexer->handout',
      'handout->quizmaster',
    ]);
  });

  it('passes one shared context down the chain, so each agent sees the last one’s work', async () => {
    agents.transcript.run.mockImplementation((context: LessonAgentContext) => {
      context.transcriptText = 'نص الدرس';
      return Promise.resolve({ headline: 'ok', output: {} });
    });

    let seenByQuizmaster: string | undefined;
    agents.quizmaster.run.mockImplementation((context: LessonAgentContext) => {
      seenByQuizmaster = context.transcriptText;
      return Promise.resolve({ headline: 'ok', output: {} });
    });

    await processor.process(job({ jobId: 'job-1' }));

    expect(seenByQuizmaster).toBe('نص الدرس');
  });

  it('marks a reviewable agent pending review, and a mandatory one not_required', async () => {
    await processor.process(job({ jobId: 'job-1' }));

    const reviewFlags = dataSource.query.mock.calls
      .filter(([sql]: [string]) =>
        sql.includes("SET status = 'completed', progress = 100"),
      )
      .map(([, params]: [string, unknown[]]) => ({
        stepId: params[0] as string,
        reviewStatus: params[3] as string,
      }));

    expect(reviewFlags).toContainEqual({
      stepId: 'step-handout',
      reviewStatus: 'pending',
    });
    expect(reviewFlags).toContainEqual({
      stepId: 'step-indexer',
      reviewStatus: 'not_required',
    });
  });

  it('stops the whole run when a mandatory agent fails', async () => {
    agents.reviewer.run.mockRejectedValue(
      new AgentFailure('الفيديو اترفض بعد المراجعة'),
    );
    stepStatuses = { reviewer: 'failed' };

    await processor.process(job({ jobId: 'job-1' }));

    // Nothing downstream of the reviewer should have been given a turn.
    expect(agents.indexer.run).not.toHaveBeenCalled();
    expect(agents.handout.run).not.toHaveBeenCalled();
    expect(runStatusWrites()).toContain('failed');
  });

  it('carries on past an optional agent that fails, so one bad handout costs no quiz', async () => {
    agents.handout.run.mockRejectedValue(
      new AgentFailure('النموذج رجّع شرح تالف'),
    );
    stepStatuses = { handout: 'failed' };

    await processor.process(job({ jobId: 'job-1' }));

    expect(agents.quizmaster.run).toHaveBeenCalledTimes(1);
    expect(runStatusWrites()).toContain('pending_review');
    expect(runStatusWrites()).not.toContain('failed');
  });

  it('surfaces an AgentFailure message verbatim, and wraps anything else', async () => {
    agents.handout.run.mockRejectedValue(new AgentFailure('الشرح خرج فاضي'));
    agents.quizmaster.run.mockRejectedValue(new Error('ECONNREFUSED'));

    await processor.process(job({ jobId: 'job-1' }));

    const failures = dataSource.query.mock.calls
      .filter(([sql]: [string]) =>
        sql.includes("SET status = 'failed', error_message"),
      )
      .map(([, params]: [string, unknown[]]) => params[1] as string);

    expect(failures).toContain('الشرح خرج فاضي');
    expect(
      failures.some((message) => message.startsWith('حصلت مشكلة تقنية')),
    ).toBe(true);
  });

  it('runs only the named agent on a feedback re-run', async () => {
    await processor.process(job({ jobId: 'job-1', onlyAgentKey: 'handout' }));

    expect(agents.handout.run).toHaveBeenCalledTimes(1);
    expect(agents.transcript.run).not.toHaveBeenCalled();
    expect(agents.quizmaster.run).not.toHaveBeenCalled();
    // A single-agent pass has nobody to hand off from.
    expect(
      recordedEvents().filter((event) => event.type === 'handoff'),
    ).toHaveLength(0);
  });

  it('completes without asking for a review when no reviewable agent produced anything', async () => {
    stepStatuses = { handout: 'skipped', quizmaster: 'skipped' };

    await processor.process(job({ jobId: 'job-1' }));

    expect(runStatusWrites()).toContain('completed');
    expect(runStatusWrites()).not.toContain('pending_review');
  });

  it('skips a job whose ai_jobs row was already claimed', async () => {
    dataSource.query.mockImplementation((sql: string) =>
      Promise.resolve(
        sql.includes('UPDATE ai_jobs') && sql.includes("'processing'")
          ? []
          : [],
      ),
    );

    await processor.process(job({ jobId: 'job-1' }));

    expect(agents.transcript.run).not.toHaveBeenCalled();
  });
});
