import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'
import { Route, Routes } from 'react-router'
import { env } from '../../../shared/lib/env'
import { server } from '../../../testing/mocks/server'
import { renderWithProviders } from '../../../testing/renderWithProviders'
import type { AuthContextValue } from '../../auth/context/AuthContext'
import { SupportTicketDetailPage } from './SupportTicketDetailPage'

const studentAuth: AuthContextValue = {
  user: { id: 'student-1', email: 's@example.com', fullName: 'محمد', role: 'student', avatarUrl: null },
  isLoading: false,
  login: vi.fn(),
  logout: vi.fn(),
  register: vi.fn(),
  updateUser: vi.fn(),
}

const teacherAuth: AuthContextValue = {
  ...studentAuth,
  user: { ...studentAuth.user!, id: 'teacher-1', role: 'teacher', fullName: 'المدرس' },
}

const ticketDetail = {
  id: 'ticket-1',
  category: 'technical',
  subject: 'الفيديو بيتوقف عند الدقيقة 15',
  status: 'open',
  courseTitle: 'الكهرومغناطيسية',
  studentName: 'محمد',
  description: 'المشكلة بتحصل من أول ما فتحت الدرس النهاردة.',
  attachments: [],
  messages: [],
  createdAt: '2026-01-01T10:00:00Z',
  updatedAt: '2026-01-01T10:00:00Z',
}

function renderPage(auth: AuthContextValue, path = '/student/support/ticket-1', routePath = '/student/support/:ticketId') {
  return renderWithProviders(
    <Routes>
      <Route path={routePath} element={<SupportTicketDetailPage />} />
    </Routes>,
    { initialEntries: [path], auth },
  )
}

describe('SupportTicketDetailPage', () => {
  it('lets the owning student view their own ticket and send a reply', async () => {
    server.use(
      http.get(`${env.apiBaseUrl}/support/tickets/ticket-1`, () => HttpResponse.json(ticketDetail)),
    )
    let posted: string | null = null
    server.use(
      http.post(`${env.apiBaseUrl}/support/tickets/ticket-1/messages`, async ({ request }) => {
        const body = (await request.json()) as { body: string }
        posted = body.body
        return HttpResponse.json({ id: 'msg-1', authorName: 'محمد', isStaffReply: false, body: posted, createdAt: '2026-01-01T11:00:00Z' })
      }),
    )

    const user = userEvent.setup()
    renderPage(studentAuth)

    expect(await screen.findByText('الفيديو بيتوقف عند الدقيقة 15')).toBeInTheDocument()
    // Student sees a read-only status badge, not the staff status selector.
    expect(screen.queryByLabelText('الحالة')).not.toBeInTheDocument()

    await user.type(screen.getByLabelText('اكتب ردًا'), 'لسه بتحصل المشكلة')
    await user.click(screen.getByRole('button', { name: 'إرسال' }))

    await waitFor(() => expect(posted).toBe('لسه بتحصل المشكلة'))
  })

  it('shows a forbidden state when the ticket belongs to another student', async () => {
    server.use(
      http.get(`${env.apiBaseUrl}/support/tickets/ticket-1`, () =>
        HttpResponse.json({ message: 'You do not own this support ticket.' }, { status: 403 }),
      ),
    )

    renderPage(studentAuth)

    expect(await screen.findByRole('alert')).toBeInTheDocument()
  })

  it('lets support staff view the student name, change status, and reply', async () => {
    server.use(
      http.get(`${env.apiBaseUrl}/support/tickets/ticket-1`, () => HttpResponse.json(ticketDetail)),
    )
    let newStatus: string | null = null
    server.use(
      http.patch(`${env.apiBaseUrl}/support/tickets/ticket-1/status`, async ({ request }) => {
        const body = (await request.json()) as { status: string }
        newStatus = body.status
        return HttpResponse.json({ ...ticketDetail, status: newStatus })
      }),
    )

    const user = userEvent.setup()
    renderPage(teacherAuth, '/teacher/support/ticket-1', '/teacher/support/:ticketId')

    expect(await screen.findByText('الفيديو بيتوقف عند الدقيقة 15')).toBeInTheDocument()
    expect(screen.getByText(/محمد/, { selector: '.support-ticket-chips .chip' })).toBeInTheDocument()

    const statusSelect = screen.getByLabelText('الحالة')
    await user.selectOptions(statusSelect, 'in_progress')

    await waitFor(() => expect(newStatus).toBe('in_progress'))
  })

  it('shows a friendly empty state when there are no messages yet', async () => {
    server.use(http.get(`${env.apiBaseUrl}/support/tickets/ticket-1`, () => HttpResponse.json(ticketDetail)))

    renderPage(studentAuth)

    expect(await screen.findByText('أهلاً بيك 👋')).toBeInTheDocument()
    expect(screen.getByText('اكتب رسالتك وهيساعدك فريق الدعم في حل المشكلة.')).toBeInTheDocument()
  })

  it('renders student and support messages with visually distinct bubble styles', async () => {
    server.use(
      http.get(`${env.apiBaseUrl}/support/tickets/ticket-1`, () =>
        HttpResponse.json({
          ...ticketDetail,
          messages: [
            {
              id: 'm1',
              authorName: 'محمد',
              isStaffReply: false,
              body: 'عندي مشكلة في تحميل الملف',
              createdAt: '2026-01-01T10:40:00Z',
            },
            {
              id: 'm2',
              authorName: 'فريق الدعم',
              isStaffReply: true,
              body: 'أهلاً محمد، هنساعدك في حل المشكلة.',
              createdAt: '2026-01-01T10:45:00Z',
            },
          ],
        }),
      ),
    )

    renderPage(studentAuth)

    const studentBubble = (await screen.findByText('عندي مشكلة في تحميل الملف')).closest('.chat-msg')
    const supportBubble = screen.getByText('أهلاً محمد، هنساعدك في حل المشكلة.').closest('.chat-msg')

    expect(studentBubble).toHaveClass('from-student')
    expect(supportBubble).toHaveClass('from-support')
    expect(studentBubble?.className).not.toBe(supportBubble?.className)
    expect(screen.getByText('فريق الدعم', { selector: '.support-tag' })).toBeInTheDocument()
  })

  it('Enter sends the message and Shift+Enter inserts a newline instead', async () => {
    server.use(http.get(`${env.apiBaseUrl}/support/tickets/ticket-1`, () => HttpResponse.json(ticketDetail)))
    let posted: string | null = null
    server.use(
      http.post(`${env.apiBaseUrl}/support/tickets/ticket-1/messages`, async ({ request }) => {
        const body = (await request.json()) as { body: string }
        posted = body.body
        return HttpResponse.json({ id: 'msg-1', authorName: 'محمد', isStaffReply: false, body: posted, createdAt: '2026-01-01T11:00:00Z' })
      }),
    )

    const user = userEvent.setup()
    renderPage(studentAuth)
    expect(await screen.findByText('الفيديو بيتوقف عند الدقيقة 15')).toBeInTheDocument()

    const textarea = screen.getByLabelText('اكتب ردًا') as HTMLTextAreaElement
    await user.type(textarea, 'سطر أول')
    await user.keyboard('{Shift>}{Enter}{/Shift}')
    await user.type(textarea, 'سطر ثاني')

    expect(textarea.value).toBe('سطر أول\nسطر ثاني')

    await user.keyboard('{Enter}')

    await waitFor(() => expect(posted).toBe('سطر أول\nسطر ثاني'))
  })

  it('does not create a duplicate message when Enter is pressed repeatedly', async () => {
    server.use(http.get(`${env.apiBaseUrl}/support/tickets/ticket-1`, () => HttpResponse.json(ticketDetail)))
    let postCount = 0
    server.use(
      http.post(`${env.apiBaseUrl}/support/tickets/ticket-1/messages`, async ({ request }) => {
        postCount += 1
        const body = (await request.json()) as { body: string }
        return HttpResponse.json({
          id: `msg-${postCount}`,
          authorName: 'محمد',
          isStaffReply: false,
          body: body.body,
          createdAt: '2026-01-01T11:00:00Z',
        })
      }),
    )

    const user = userEvent.setup()
    renderPage(studentAuth)
    expect(await screen.findByText('الفيديو بيتوقف عند الدقيقة 15')).toBeInTheDocument()

    await user.type(screen.getByLabelText('اكتب ردًا'), 'رسالة واحدة')
    await user.keyboard('{Enter}{Enter}{Enter}')

    await screen.findByText('رسالة واحدة')
    await waitFor(() => expect(postCount).toBe(1))
  })

  it('shows a typing indicator while sending and hides it once the reply is confirmed', async () => {
    server.use(http.get(`${env.apiBaseUrl}/support/tickets/ticket-1`, () => HttpResponse.json(ticketDetail)))
    let resolvePost: (() => void) | undefined
    server.use(
      http.post(`${env.apiBaseUrl}/support/tickets/ticket-1/messages`, async ({ request }) => {
        const body = (await request.json()) as { body: string }
        await new Promise<void>((resolve) => {
          resolvePost = resolve
        })
        return HttpResponse.json({ id: 'msg-1', authorName: 'محمد', isStaffReply: false, body: body.body, createdAt: '2026-01-01T11:00:00Z' })
      }),
    )

    const user = userEvent.setup()
    renderPage(studentAuth)
    expect(await screen.findByText('الفيديو بيتوقف عند الدقيقة 15')).toBeInTheDocument()

    await user.type(screen.getByLabelText('اكتب ردًا'), 'مرحبا')
    await user.click(screen.getByRole('button', { name: 'إرسال' }))

    expect(await screen.findByRole('status', { name: 'فريق الدعم يكتب الآن' })).toBeInTheDocument()

    resolvePost?.()

    await waitFor(() =>
      expect(screen.queryByRole('status', { name: 'فريق الدعم يكتب الآن' })).not.toBeInTheDocument(),
    )
    expect(await screen.findByText('مرحبا')).toBeInTheDocument()
  })

  it('shows a retry option when sending fails, and retry resends the message', async () => {
    server.use(http.get(`${env.apiBaseUrl}/support/tickets/ticket-1`, () => HttpResponse.json(ticketDetail)))
    let attempt = 0
    server.use(
      http.post(`${env.apiBaseUrl}/support/tickets/ticket-1/messages`, async ({ request }) => {
        attempt += 1
        const body = (await request.json()) as { body: string }
        if (attempt === 1) {
          return HttpResponse.json({ message: 'Internal error' }, { status: 500 })
        }
        return HttpResponse.json({ id: 'msg-retry', authorName: 'محمد', isStaffReply: false, body: body.body, createdAt: '2026-01-01T11:00:00Z' })
      }),
    )

    const user = userEvent.setup()
    renderPage(studentAuth)
    expect(await screen.findByText('الفيديو بيتوقف عند الدقيقة 15')).toBeInTheDocument()

    await user.type(screen.getByLabelText('اكتب ردًا'), 'محتاج مساعدة')
    await user.click(screen.getByRole('button', { name: 'إرسال' }))

    const retryButton = await screen.findByRole('button', { name: 'إعادة المحاولة' })
    await user.click(retryButton)

    await waitFor(() => expect(attempt).toBe(2))
    expect(await screen.findByText('محتاج مساعدة')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'إعادة المحاولة' })).not.toBeInTheDocument()
  })
})
