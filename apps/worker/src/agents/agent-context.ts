import type { CaptionCue } from '../adapters/captions/caption-provider';
import type { LessonAgentKey, LessonAgentRunConfig } from './roster';

export interface RunRecord {
  id: string;
  lesson_id: string;
  course_id: string;
  video_id: string | null;
  teacher_id: string;
  config: LessonAgentRunConfig;
}

export interface LessonRecord {
  id: string;
  title: string;
  section_id: string;
  course_id: string;
}

export interface CourseRecord {
  id: string;
  title: string;
  teacher_id: string;
}

export interface VideoRecord {
  id: string;
  title: string;
  video_url: string;
}

/**
 * The baton passed from agent to agent.
 *
 * Everything above `videoTranscriptId` is resolved once before the first
 * agent runs; everything below it is filled in as agents complete, which
 * is exactly what makes the handoffs real rather than decorative — the
 * indexer genuinely cannot start until the transcriber has put `cues` on
 * the context.
 *
 * On a single-step re-run (the teacher commented on the handout, say)
 * the orchestrator rehydrates `transcriptText` from the chunks the
 * indexer already persisted, so the writer still gets its input without
 * re-fetching captions for a video that hasn't changed.
 */
export interface LessonAgentContext {
  run: RunRecord;
  lesson: LessonRecord;
  course: CourseRecord;
  video: VideoRecord;
  config: LessonAgentRunConfig;

  videoTranscriptId?: string;
  transcriptVersion?: number;
  cues?: CaptionCue[];
  transcriptText?: string;
}

/** What an agent hands back to the orchestrator when it finishes. */
export interface AgentOutcome {
  /** One human sentence shown on the agent's card. */
  headline: string;
  /** Structured result, stored on `lesson_agent_steps.output`. */
  output: Record<string, unknown>;
}

/**
 * How an agent narrates itself while working. The orchestrator supplies
 * the implementation, so an agent never touches the database directly —
 * it only says what it is doing.
 */
export interface AgentReporter {
  /** Moves the step's progress bar and, if given a message, logs a line. */
  progress(percent: number, message?: string): Promise<void>;
  /** Adds a line to the run's timeline without moving the bar. */
  note(message: string, metadata?: Record<string, unknown>): Promise<void>;
}

export interface LessonAgent {
  readonly key: LessonAgentKey;
  run(
    context: LessonAgentContext,
    reporter: AgentReporter,
  ): Promise<AgentOutcome>;
}

/**
 * Thrown by an agent when the failure is the teacher's to act on (no
 * captions, an off-topic video, an unusable model response) rather than
 * an infrastructure fault. The orchestrator surfaces `message` verbatim
 * on the step instead of a stack trace, so every string here is written
 * in Arabic and addressed to the teacher.
 */
export class AgentFailure extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AgentFailure';
  }
}
