import { httpClient } from '../../../shared/api/http-client'
import type { AssistantAction } from '../types/assistant-action.types'

export async function getAssistantActions(status?: string): Promise<AssistantAction[]> {
  const query = status && status !== 'all' ? `?status=${status}` : ''
  return httpClient.get<AssistantAction[]>(`/teacher/assistant-actions${query}`)
}

export async function getPendingActionCount(): Promise<number> {
  const { count } = await httpClient.get<{ count: number }>(
    '/teacher/assistant-actions/pending-count',
  )
  return count
}

export async function approveAssistantAction(actionId: string): Promise<AssistantAction> {
  return httpClient.post<AssistantAction>(`/teacher/assistant-actions/${actionId}/approve`)
}

export async function rejectAssistantAction(
  actionId: string,
  note?: string,
): Promise<AssistantAction> {
  return httpClient.post<AssistantAction>(
    `/teacher/assistant-actions/${actionId}/reject`,
    note ? { note } : {},
  )
}
