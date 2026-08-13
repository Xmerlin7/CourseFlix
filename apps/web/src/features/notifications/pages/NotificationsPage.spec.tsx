import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { env } from '../../../shared/lib/env'
import { server } from '../../../testing/mocks/server'
import { renderWithProviders } from '../../../testing/renderWithProviders'
import { NotificationsPage } from './NotificationsPage'

const NOTIFICATIONS = [
  {
    id: 'notification-1',
    type: 'quiz_ready' as const,
    title: 'اختبار قصير جاهز لك',
    message: 'رسالة 1',
    relatedEntityType: 'mini_quiz',
    relatedEntityId: 'quiz-1',
    isRead: false,
    createdAt: '2026-08-04T10:00:00.000Z',
  },
  {
    id: 'notification-2',
    type: 'announcement' as const,
    title: 'إعلان من المعلم',
    message: 'رسالة 2',
    relatedEntityType: null,
    relatedEntityId: null,
    isRead: true,
    createdAt: '2026-08-03T10:00:00.000Z',
  },
]

describe('NotificationsPage', () => {
  it('renders notifications and shows the unread count', async () => {
    server.use(
      http.get(`${env.apiBaseUrl}/notifications`, () => HttpResponse.json(NOTIFICATIONS)),
    )

    renderWithProviders(<NotificationsPage />)

    expect(await screen.findByText('اختبار قصير جاهز لك')).toBeInTheDocument()
    expect(screen.getByText('عندك 1 إشعار غير مقروء')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /اختبار قصير جاهز لك/ })).toHaveAttribute(
      'href',
      '/student/mini-quizzes/quiz-1',
    )
  })

  it('re-requests the list with the selected status filter', async () => {
    let lastStatus: string | null = null
    server.use(
      http.get(`${env.apiBaseUrl}/notifications`, ({ request }) => {
        lastStatus = new URL(request.url).searchParams.get('status')
        return HttpResponse.json(NOTIFICATIONS)
      }),
    )

    const user = userEvent.setup()
    renderWithProviders(<NotificationsPage />)

    await screen.findByText('اختبار قصير جاهز لك')
    await user.click(screen.getByRole('button', { name: 'غير مقروء' }))

    await waitFor(() => {
      expect(lastStatus).toBe('unread')
    })
  })

  it('marks all as read and clears the unread badge', async () => {
    server.use(
      http.get(`${env.apiBaseUrl}/notifications`, () => HttpResponse.json(NOTIFICATIONS)),
      http.patch(`${env.apiBaseUrl}/notifications/read-all`, () =>
        HttpResponse.json({ updated: 1 }),
      ),
    )

    const user = userEvent.setup()
    renderWithProviders(<NotificationsPage />)

    await screen.findByText('اختبار قصير جاهز لك')
    await user.click(screen.getByRole('button', { name: /تحديد الكل كمقروء/ }))

    await waitFor(() => {
      expect(screen.getByText('كل الإشعارات مقروءة')).toBeInTheDocument()
    })
  })
})
