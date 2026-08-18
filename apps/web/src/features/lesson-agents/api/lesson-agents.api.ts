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

export async function startLessonAgentRun(lessonId: string): Promise<LessonAgentRunDetail> {
  return httpClient.post<LessonAgentRunDetail>(`/teacher/lessons/${lessonId}/agent-runs`, {})
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
