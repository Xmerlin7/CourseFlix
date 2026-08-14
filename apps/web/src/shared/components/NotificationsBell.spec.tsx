import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { env } from '../../shared/lib/env'
import { server } from '../../testing/mocks/server'
import { renderWithProviders } from '../../testing/renderWithProviders'
import { NotificationsBell } from './NotificationsBell'

const MOCK_NOTIFICATIONS = [
  {
    id: 'notif-unread-1',
    type: 'announcement' as const,
    title: 'تحديث سريعة في المنصة',
    message: 'تم إضافة ميزات جديدة',
    relatedEntityType: null,
    relatedEntityId: null,
    isRead: false,
    createdAt: '2026-08-10T10:00:00.000Z',
  },
  {
    id: 'notif-read-1',
    type: 'quiz_ready' as const,
    title: 'تم تصحيح الواجب',
    message: 'حصلت على 10/10',
    relatedEntityType: 'mini_quiz',
    relatedEntityId: 'quiz-5',
    isRead: true,
    createdAt: '2026-08-09T10:00:00.000Z',
  },
]

describe('NotificationsBell component', () => {
  it('renders bell button with notification count badge', () => {
    renderWithProviders(<NotificationsBell notificationCount={3} viewAllPath="/student/notifications" />)

    const button = screen.getByRole('button', { name: 'الإشعارات' })
    expect(button).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('opens panel on click and displays read/unread items with distinct styling', async () => {
    server.use(
      http.get(`${env.apiBaseUrl}/notifications`, () => HttpResponse.json(MOCK_NOTIFICATIONS)),
    )

    const user = userEvent.setup()
    renderWithProviders(<NotificationsBell notificationCount={1} viewAllPath="/student/notifications" />)

    await user.click(screen.getByRole('button', { name: 'الإشعارات' }))

    const unreadTitle = await screen.findByText('تحديث سريعة في المنصة')
    const readTitle = screen.getByText('تم تصحيح الواجب')

    const unreadItem = unreadTitle.closest('.notif-item')
    const readItem = readTitle.closest('.notif-item')

    expect(unreadItem).toHaveClass('unread')
    expect(readItem).toHaveClass('read')

    // Unread item contains unread-dot
    expect(unreadItem?.querySelector('.unread-dot')).toBeInTheDocument()

    // Read item does NOT contain unread-dot
    expect(readItem?.querySelector('.unread-dot')).toBeNull()
  })

  it('marks item as read when clicked', async () => {
    let markedId: string | null = null
    server.use(
      http.get(`${env.apiBaseUrl}/notifications`, () => HttpResponse.json(MOCK_NOTIFICATIONS)),
      http.patch(`${env.apiBaseUrl}/notifications/:id/read`, ({ params }) => {
        markedId = params.id as string
        return HttpResponse.json({ id: params.id, isRead: true })
      }),
    )

    const user = userEvent.setup()
    renderWithProviders(<NotificationsBell notificationCount={1} viewAllPath="/student/notifications" />)

    await user.click(screen.getByRole('button', { name: 'الإشعارات' }))

    const unreadTitle = await screen.findByText('تحديث سريعة في المنصة')
    const unreadItem = unreadTitle.closest('.notif-item')

    await user.click(unreadItem!)

    await waitFor(() => {
      expect(markedId).toBe('notif-unread-1')
    })
  })

  it('marks all items as read when clicking "تحديد الكل كمقروء"', async () => {
    let markAllCalled = false
    server.use(
      http.get(`${env.apiBaseUrl}/notifications`, () => HttpResponse.json(MOCK_NOTIFICATIONS)),
      http.patch(`${env.apiBaseUrl}/notifications/read-all`, () => {
        markAllCalled = true
        return HttpResponse.json({ updated: 1 })
      }),
    )

    const user = userEvent.setup()
    renderWithProviders(<NotificationsBell notificationCount={1} viewAllPath="/student/notifications" />)

    await user.click(screen.getByRole('button', { name: 'الإشعارات' }))

    const markAllBtn = await screen.findByRole('button', { name: /تحديد الكل كمقروء/ })
    await user.click(markAllBtn)

    await waitFor(() => {
      expect(markAllCalled).toBe(true)
    })

    const unreadTitle = screen.getByText('تحديث سريعة في المنصة')
    const item = unreadTitle.closest('.notif-item')
    expect(item).toHaveClass('read')
    expect(item?.querySelector('.unread-dot')).toBeNull()
  })
})
