export type AssistantActionStatus = 'pending' | 'approved' | 'rejected'

export interface AssistantAction {
  id: string
  summary: string
  status: AssistantActionStatus
  assistantId: string
  assistantName: string
  reviewNote: string | null
  /** Set when an approved action failed to replay — see the API's service. */
  executionError: string | null
  createdAt: string
  reviewedAt: string | null
}

/**
 * The 202-style body every parked assistant write answers with instead of
 * the resource it would have created. Callers detect it with
 * `isPendingApproval` rather than by status code, since the API returns
 * the controller's normal 200/201.
 */
export interface PendingApprovalResponse {
  pendingApproval: true
  action: AssistantAction
  message: string
}

export function isPendingApproval(value: unknown): value is PendingApprovalResponse {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as { pendingApproval?: unknown }).pendingApproval === true
  )
}
