export type LessonAgentKey =
  | 'transcript'
  | 'reviewer'
  | 'indexer'
  | 'handout'
  | 'quizmaster'
  | 'notifier'

export type LessonAgentRunStatus =
  | 'queued'
  | 'running'
  | 'pending_review'
  | 'completed'
  | 'failed'

export type LessonAgentStepStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'skipped'

export type LessonAgentReviewStatus =
  | 'not_required'
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'revision_requested'

export type LessonAgentEventType =
  | 'run_started'
  | 'agent_started'
  | 'agent_progress'
  | 'handoff'
  | 'agent_completed'
  | 'agent_failed'
  | 'agent_skipped'
  | 'review_requested'
  | 'teacher_feedback'
  | 'teacher_approved'
  | 'teacher_rejected'
  | 'run_completed'
  | 'run_failed'

export type HandoutDetailLevel = 'concise' | 'standard' | 'deep'
export type AgentQuizDifficulty = 'easy' | 'medium' | 'hard'
export type AgentQuizQuestionType = 'mcq' | 'true_false'

/** Whatever the agent that filled it in had to say — keyed by agent, not discriminated. */
export interface LessonAgentStepOutput {
  cueCount?: number
  durationSeconds?: number
  provider?: string
  transcriptPreview?: string

  verdict?: 'approved' | 'rejected'
  reason?: string

  chunkCount?: number
  embeddedCount?: number

  documentId?: string
  fileName?: string
  pageTitles?: string[]
  handoutPreview?: string

  quizId?: string
  questions?: Array<{
    type: string
    text: string
    options: string[]
    correctAnswer: string
  }>
}

export interface LessonAgentStep {
  id: string
  agentKey: LessonAgentKey
  name: string
  role: string
  icon: string
  mandatory: boolean
  reviewable: boolean
  /** Quota cost of re-running this one agent. */
  creditCost: number
  orderIndex: number
  status: LessonAgentStepStatus
  reviewStatus: LessonAgentReviewStatus
  progress: number
  headline: string | null
  output: LessonAgentStepOutput | null
  errorMessage: string | null
  attempt: number
  startedAt: string | null
  finishedAt: string | null
  feedback: Array<{ id: string; message: string; createdAt: string }>
}

export interface LessonAgentEvent {
  id: string
  type: LessonAgentEventType
  agentKey: LessonAgentKey | null
  toAgentKey: LessonAgentKey | null
  message: string
  metadata: Record<string, unknown> | null
  createdAt: string
}

export interface LessonAgentRunConfig {
  enabledAgents: LessonAgentKey[]
  handout: {
    pageCount: number
    detailLevel: HandoutDetailLevel
    includeExamples: boolean
    includeKeyTerms: boolean
    includeSummary: boolean
  }
  quiz: {
    difficulty: AgentQuizDifficulty
    mcqCount: number
    trueFalseCount: number
    dueInDays: number
  }
}

export interface LessonAgentRunSummary {
  id: string
  lessonId: string
  courseId: string
  status: LessonAgentRunStatus
  progress: number
  /** Quota credits this run has cost so far, rewrites included. */
  creditsCharged: number
  errorMessage: string | null
  createdAt: string
  finishedAt: string | null
}

export interface LessonAgentRunDetail extends LessonAgentRunSummary {
  lessonTitle: string
  config: LessonAgentRunConfig
  startedAt: string | null
  canPublish: boolean
  steps: LessonAgentStep[]
  events: LessonAgentEvent[]
}

export interface AgentSettings {
  handoutEnabled: boolean
  handoutPageCount: number
  handoutDetailLevel: HandoutDetailLevel
  handoutIncludeExamples: boolean
  handoutIncludeKeyTerms: boolean
  handoutIncludeSummary: boolean
  quizEnabled: boolean
  quizDifficulty: AgentQuizDifficulty
  quizMcqCount: number
  quizTrueFalseCount: number
  quizDueInDays: number
  notifierEnabled: boolean
}

export type UpdateAgentSettingsPayload = Partial<AgentSettings>
