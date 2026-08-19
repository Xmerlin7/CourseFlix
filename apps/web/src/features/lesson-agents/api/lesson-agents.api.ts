import { httpClient } from '../../../shared/api/http-client'
import type {
  AgentSettings,
  LessonAgentRunDetail,
  LessonAgentRunSummary,
  UpdateAgentSettingsPayload,
} from '../types/lesson-agents.types'

export async function getAgentSettings(): Promise<AgentSettings> {
  return httpClient.get<AgentSettings>('/teacher/agent-settings')
}

export async function updateAgentSettings(
  payload: UpdateAgentSettingsPayload,
): Promise<AgentSettings> {
  return httpClient.patch<AgentSettings>('/teacher/agent-settings', payload)
}

/**
 * `overrides` is a one-off tweak for this lesson only — the API merges it
 * over the teacher's saved settings into the run's frozen config and
 * never writes it back, so turning the handout off for one short lesson
 * doesn't change their default.
 */
export async function startLessonAgentRun(
  lessonId: string,
  overrides?: UpdateAgentSettingsPayload,
): Promise<LessonAgentRunDetail> {
  return httpClient.post<LessonAgentRunDetail>(
    `/teacher/lessons/${lessonId}/agent-runs`,
    overrides ? { overrides } : {},
  )
}

export async function getCourseAgentRuns(courseId: string): Promise<LessonAgentRunSummary[]> {
  return httpClient.get<LessonAgentRunSummary[]>(`/teacher/courses/${courseId}/agent-runs`)
}

export async function getAgentRun(runId: string): Promise<LessonAgentRunDetail> {
  return httpClient.get<LessonAgentRunDetail>(`/teacher/agent-runs/${runId}`)
}

export async function approveAgentStep(
  runId: string,
  stepId: string,
): Promise<LessonAgentRunDetail> {
  return httpClient.post<LessonAgentRunDetail>(
    `/teacher/agent-runs/${runId}/steps/${stepId}/approve`,
  )
}

export async function rejectAgentStep(
  runId: string,
  stepId: string,
): Promise<LessonAgentRunDetail> {
  return httpClient.post<LessonAgentRunDetail>(
    `/teacher/agent-runs/${runId}/steps/${stepId}/reject`,
  )
}

export async function sendAgentStepFeedback(
  runId: string,
  stepId: string,
  message: string,
): Promise<LessonAgentRunDetail> {
  return httpClient.post<LessonAgentRunDetail>(
    `/teacher/agent-runs/${runId}/steps/${stepId}/feedback`,
    { message },
  )
}

export async function publishAgentRun(runId: string): Promise<LessonAgentRunDetail> {
  return httpClient.post<LessonAgentRunDetail>(`/teacher/agent-runs/${runId}/publish`)
}
