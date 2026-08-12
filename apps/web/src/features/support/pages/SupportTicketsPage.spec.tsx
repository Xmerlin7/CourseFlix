import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Route, Routes } from 'react-router'
import { env } from '../../../shared/lib/env'
import { server } from '../../../testing/mocks/server'
import { renderWithProviders } from '../../../testing/renderWithProviders'
import type { AuthContextValue } from '../../auth/context/AuthContext'
import { SupportTicketsPage } from './SupportTicketsPage'

const studentAuth: AuthContextValue = {
  user: {
    id: 'student-1',
    email: 'student@example.com',
    fullName: 'محمد',
    role: 'student',
    avatarUrl: null,
  },
  isLoading: false,
  login: vi.fn(),
  logout: vi.fn(),
  register: vi.fn(),
  updateUser: vi.fn(),
}

function renderPage() {
  return renderWithProviders(
    <Routes>
      <Route path="/student/support" element={<SupportTicketsPage />} />
    </Routes>,
    { initialEntries: ['/student/support'], auth: studentAuth },
  )
}

const sampleTicket = {
  id: 'ticket-1',
  category: 'technical',
  subject: 'الفيديو بيتوقف عند الدقيقة 15',
  status: 'open',
  courseTitle: 'الكهرومغناطيسية',
  studentName: 'محمد',
  createdAt: '2026-01-01T10:00:00Z',
  updatedAt: '2026-01-01T10:00:00Z',
}

describe('SupportTicketsPage', () => {
  // CreateTicketDialog fetches the student's enrollments unconditionally
  // (it's mounted whether or not the dialog is open, so its course
  // dropdown can populate instantly on open) — every test needs this
  // handled even when it never opens the dialog.
  beforeEach(() => {
    server.use(http.get(`${env.apiBaseUrl}/student/enrollments`, () => HttpResponse.json([])))
  })

  it('renders the student\'s ticket list with status badge', async () => {
    server.use(http.get(`${env.apiBaseUrl}/support/tickets`, () => HttpResponse.json([sampleTicket])))

    renderPage()

    const link = await screen.findByText('الفيديو بيتوقف عند الدقيقة 15')
    const card = link.closest('a')!
    expect(within(card).getByText('مفتوح')).toBeInTheDocument()
  })



  it('shows an empty state with a create-ticket action when there are no tickets', async () => {
    server.use(http.get(`${env.apiBaseUrl}/support/tickets`, () => HttpResponse.json([])))

    renderPage()

    expect(await screen.findByText('مفيش طلبات دعم لسه')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'طلب دعم جديد' })[0]).toBeInTheDocument()
  })

  it('validates required fields before submitting a new ticket', async () => {
    server.use(http.get(`${env.apiBaseUrl}/support/tickets`, () => HttpResponse.json([])))

    const user = userEvent.setup()
    renderPage()

    await screen.findByText('مفيش طلبات دعم لسه')
    await user.click(screen.getAllByRole('button', { name: 'طلب دعم جديد' })[0])

    const dialog = await screen.findByRole('dialog', { hidden: true })
    // HTML5 `required` blocks native submission before our own validation
    // even runs, so drop it to exercise the component's own check.
    within(dialog)
      .getByLabelText('العنوان')
      .removeAttribute('required')
    within(dialog)
      .getByLabelText('وصف المشكلة')
      .removeAttribute('required')

    await user.click(within(dialog).getByRole('button', { name: 'إرسال الطلب' }))

    expect(await within(dialog).findByRole('alert')).toHaveTextContent('العنوان والوصف مطلوبين.')
  })

  it('lets a student create a ticket with category/subject/description', async () => {
    server.use(http.get(`${env.apiBaseUrl}/support/tickets`, () => HttpResponse.json([])))

    let posted: { category: string | null; subject: string | null; description: string | null } | null = null
    server.use(
      http.post(`${env.apiBaseUrl}/support/tickets`, async ({ request }) => {
        const formData = await request.formData()
        posted = {
          category: formData.get('category') as string | null,
          subject: formData.get('subject') as string | null,
          description: formData.get('description') as string | null,
        }
        return HttpResponse.json({ ...sampleTicket, id: 'ticket-2', subject: posted.subject })
      }),
    )

    const user = userEvent.setup()
    renderPage()

    await screen.findByText('مفيش طلبات دعم لسه')
    await user.click(screen.getAllByRole('button', { name: 'طلب دعم جديد' })[0])

    const dialog = await screen.findByRole('dialog', { hidden: true })
    await user.type(within(dialog).getByLabelText('العنوان'), 'الفيديو بيتوقف')
    await user.type(within(dialog).getByLabelText('وصف المشكلة'), 'بيتوقف عند الدقيقة 15')
    await user.click(within(dialog).getByRole('button', { name: 'إرسال الطلب' }))

    await waitFor(() => expect(posted).not.toBeNull())
    expect(posted).toEqual({
      category: 'technical',
      subject: 'الفيديو بيتوقف',
      description: 'بيتوقف عند الدقيقة 15',
    })
  })

  it('closes the dialog when clicking the close button or cancel button', async () => {
    server.use(http.get(`${env.apiBaseUrl}/support/tickets`, () => HttpResponse.json([])))

    const user = userEvent.setup()
    renderPage()

    await screen.findByText('مفيش طلبات دعم لسه')
    await user.click(screen.getAllByRole('button', { name: 'طلب دعم جديد' })[0])

    const dialog = await screen.findByRole('dialog', { hidden: true })
    expect(dialog).toBeInTheDocument()

    await user.click(within(dialog).getByRole('button', { name: 'إغلاق' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('supports selecting an optional course when creating a ticket', async () => {
    server.use(http.get(`${env.apiBaseUrl}/support/tickets`, () => HttpResponse.json([])))
    server.use(
      http.get(`${env.apiBaseUrl}/student/enrollments`, () =>
        HttpResponse.json([
          {
            courseId: 'c-101',
            courseTitle: 'الفيزياء الحديثة',
            status: 'active',
            progressPercent: 20,
            completedLessonsCount: 2,
            totalLessonsCount: 10,
            coverImageUrl: null,
            enrolledAt: '2026-01-01T00:00:00Z',
            lastAccessedAt: '2026-01-01T00:00:00Z',
            currentLesson: null,
          },
        ]),
      ),
    )

    let postedCourseId: string | null = null
    server.use(
      http.post(`${env.apiBaseUrl}/support/tickets`, async ({ request }) => {
        const bodyText = await request.text()
        if (bodyText.includes('c-101')) postedCourseId = 'c-101'
        return HttpResponse.json({ ...sampleTicket, id: 'ticket-3' })
      }),
    )

    const user = userEvent.setup()
    renderPage()

    await screen.findByText('مفيش طلبات دعم لسه')
    await user.click(screen.getAllByRole('button', { name: 'طلب دعم جديد' })[0])


    const dialog = await screen.findByRole('dialog', { hidden: true })
    const courseSelect = await within(dialog).findByLabelText('الدورة المرتبطة (اختياري)')
    await user.selectOptions(courseSelect, 'c-101')

    await user.type(within(dialog).getByLabelText('العنوان'), 'سؤال في الدرس الثالث')
    await user.type(within(dialog).getByLabelText('وصف المشكلة'), 'المشكلة موضحة بالحساب')

    await user.click(within(dialog).getByRole('button', { name: 'إرسال الطلب' }))

    await waitFor(() => expect(postedCourseId).toBe('c-101'))
  })
})


