import { renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { env } from '../../shared/lib/env'
import { server } from '../../testing/mocks/server'
import { useStudentSidebarUnread } from '../../shared/hooks/useStudentSidebarUnread'

function makeNotifications(...types: string[]) {
  return types.map((type, i) => ({
    id: `notif-${i}`,
    type,
    title: 'Test',
    message: 'Test message',
    relatedEntityType: null,
    relatedEntityId: null,
    isRead: false,
    createdAt: new Date().toISOString(),
  }))
}

describe('useStudentSidebarUnread', () => {
  it('returns false for both flags when there are no unread notifications', async () => {
    server.use(
      http.get(`${env.apiBaseUrl}/notifications`, () => HttpResponse.json([])),
    )
    const { result } = renderHook(() => useStudentSidebarUnread())
    await waitFor(() => {
      expect(result.current.communityHasUnread).toBe(false)
      expect(result.current.supportHasUnread).toBe(false)
    })
  })

  it('sets communityHasUnread=true when there is a discussion_reply notification', async () => {
    server.use(
      http.get(`${env.apiBaseUrl}/notifications`, () =>
        HttpResponse.json(makeNotifications('discussion_reply')),
      ),
    )
    const { result } = renderHook(() => useStudentSidebarUnread())
    await waitFor(() => {
      expect(result.current.communityHasUnread).toBe(true)
      expect(result.current.supportHasUnread).toBe(false)
    })
  })

  it('sets communityHasUnread=true when there is a discussion_accepted notification', async () => {
    server.use(
      http.get(`${env.apiBaseUrl}/notifications`, () =>
        HttpResponse.json(makeNotifications('discussion_accepted')),
      ),
    )
    const { result } = renderHook(() => useStudentSidebarUnread())
    await waitFor(() => {
      expect(result.current.communityHasUnread).toBe(true)
    })
  })

  it('sets supportHasUnread=true when there is a support_ticket_update notification', async () => {
    server.use(
      http.get(`${env.apiBaseUrl}/notifications`, () =>
        HttpResponse.json(makeNotifications('support_ticket_update')),
      ),
    )
    const { result } = renderHook(() => useStudentSidebarUnread())
    await waitFor(() => {
      expect(result.current.communityHasUnread).toBe(false)
      expect(result.current.supportHasUnread).toBe(true)
    })
  })

  it('sets both flags when both notification types are present', async () => {
    server.use(
      http.get(`${env.apiBaseUrl}/notifications`, () =>
        HttpResponse.json(makeNotifications('discussion_reply', 'support_ticket_update')),
      ),
    )
    const { result } = renderHook(() => useStudentSidebarUnread())
    await waitFor(() => {
      expect(result.current.communityHasUnread).toBe(true)
      expect(result.current.supportHasUnread).toBe(true)
    })
  })

  it('silently ignores fetch errors and keeps both flags false', async () => {
    server.use(
      http.get(`${env.apiBaseUrl}/notifications`, () => HttpResponse.error()),
    )
    const { result } = renderHook(() => useStudentSidebarUnread())
    // Give the hook a moment to attempt and fail the fetch
    await new Promise((r) => setTimeout(r, 100))
    expect(result.current.communityHasUnread).toBe(false)
    expect(result.current.supportHasUnread).toBe(false)
  })
})
