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
  verifyOtp: vi.fn(),
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
  it('lets the owning student view their own ticket in read-only mode without reply composer', async () => {
    server.use(
      http.get(`${env.apiBaseUrl}/support/tickets/ticket-1`, () => HttpResponse.json(ticketDetail)),
    )

    renderPage(studentAuth)

    expect(await screen.findByText('الفيديو بيتوقف عند الدقيقة 15')).toBeInTheDocument()
    // Student sees a read-only status badge, not the staff status selector.
    expect(screen.queryByLabelText('الحالة')).not.toBeInTheDocument()

    // The reply composer must NOT be rendered (read-only view)
    expect(screen.queryByLabelText('اكتب ردًا')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'إرسال' })).not.toBeInTheDocument()
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

  it('lets support staff view the student name and change status', async () => {
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

  it('shows a friendly compact empty state when there are no messages yet', async () => {
    server.use(http.get(`${env.apiBaseUrl}/support/tickets/ticket-1`, () => HttpResponse.json(ticketDetail)))

    renderPage(studentAuth)

    expect(await screen.findByText('أهلاً بيك')).toBeInTheDocument()
    expect(screen.getByText('تم استلام طلب الدعم. هنراجع طلبك ونرد عليك هنا.')).toBeInTheDocument()
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

  it('renders attachments with preview component', async () => {
    server.use(
      http.get(`${env.apiBaseUrl}/support/tickets/ticket-1`, () =>
        HttpResponse.json({
          ...ticketDetail,
          attachments: [
            { id: 'att-1', fileName: 'screenshot.png', mimeType: 'image/png' },
            { id: 'att-2', fileName: 'error.log', mimeType: 'text/plain' },
          ],
        }),
      ),
    )

    renderPage(studentAuth)

    expect(await screen.findByAltText('screenshot.png')).toBeInTheDocument()
    expect(screen.getByText('error.log')).toBeInTheDocument()
  })
})
