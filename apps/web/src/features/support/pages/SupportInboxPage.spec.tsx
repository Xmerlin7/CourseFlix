import { fireEvent, screen, waitFor, within } from '@testing-library/react'


import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { Route, Routes } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { env } from '../../../shared/lib/env'
import { server } from '../../../testing/mocks/server'
import { renderWithProviders } from '../../../testing/renderWithProviders'
import type { AuthContextValue } from '../../auth/context/AuthContext'
import { SupportInboxPage } from './SupportInboxPage'

const teacherAuth: AuthContextValue = {
  user: {
    id: 'teacher-1',
    email: 'teacher@example.com',
    fullName: 'أحمد معلم',
    role: 'teacher',
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
      <Route path="/teacher/support" element={<SupportInboxPage />} />
    </Routes>,
    { initialEntries: ['/teacher/support'], auth: teacherAuth },
  )
}

const sampleTicket = {
  id: 'ticket-101',
  category: 'technical',
  subject: 'مشكلة في تحميل خطة المادة',
  status: 'open',
  courseTitle: 'الفيزياء الكلاسيكية',
  studentName: 'محمود علي',
  createdAt: '2026-01-01T10:00:00Z',
  updatedAt: '2026-01-01T10:00:00Z',
}

describe('SupportInboxPage', () => {
  it('renders support inbox header and ticket list for staff', async () => {
    server.use(http.get(`${env.apiBaseUrl}/support/staff/tickets`, () => HttpResponse.json([sampleTicket])))

    renderPage()

    expect(await screen.findByText('صندوق الدعم الفني')).toBeInTheDocument()
    expect(screen.getByText('متابعة وإدارة طلبات الدعم الفني الخاصة بالطلاب والرد عليها')).toBeInTheDocument()

    const titleEl = await screen.findByText('مشكلة في تحميل خطة المادة')
    const card = titleEl.closest('a')!
    expect(within(card).getByText('الطالب: محمود علي')).toBeInTheDocument()
    expect(within(card).getByText('مفتوح')).toBeInTheDocument()
  })

  it('filters support inbox tickets by status tabs', async () => {
    server.use(
      http.get(`${env.apiBaseUrl}/support/staff/tickets`, () =>
        HttpResponse.json([
          sampleTicket,
          {
            id: 'ticket-102',
            category: 'payment',
            subject: 'استفسار عن الفاتورة',
            status: 'resolved',
            courseTitle: null,
            studentName: 'سارة حسن',
            createdAt: '2026-01-02T10:00:00Z',
            updatedAt: '2026-01-02T10:00:00Z',
          },
        ]),
      ),
    )

    const user = userEvent.setup()
    renderPage()

    await screen.findByText('مشكلة في تحميل خطة المادة')
    expect(screen.getByText('استفسار عن الفاتورة')).toBeInTheDocument()

    const resolvedTab = screen.getByRole('tab', { name: /تم الحل/ })
    await user.click(resolvedTab)

    expect(screen.getByText('استفسار عن الفاتورة')).toBeInTheDocument()
    expect(screen.queryByText('مشكلة في تحميل خطة المادة')).not.toBeInTheDocument()
  })

  it('filters support inbox tickets by search query', async () => {
    server.use(
      http.get(`${env.apiBaseUrl}/support/staff/tickets`, ({ request }) => {
        const url = new URL(request.url)
        const search = url.searchParams.get('search')?.toLowerCase()
        const all = [
          sampleTicket,
          {
            id: 'ticket-103',
            category: 'account' as const,
            subject: 'تغيير كلمة المرور',
            status: 'in_progress' as const,
            courseTitle: null,
            studentName: 'عمر خالد',
            createdAt: '2026-01-03T10:00:00Z',
            updatedAt: '2026-01-03T10:00:00Z',
          },
        ]
        if (!search) return HttpResponse.json(all)
        return HttpResponse.json(
          all.filter(
            (t) =>
              t.subject.toLowerCase().includes(search) ||
              t.studentName.toLowerCase().includes(search),
          ),
        )
      }),
    )


    renderPage()


    await screen.findByText('مشكلة في تحميل خطة المادة')

    const searchInput = screen.getByPlaceholderText('ابحث في طلبات الدعم...')
    fireEvent.change(searchInput, { target: { value: 'كلمة' } })

    await waitFor(() => {
      expect(screen.getByText('تغيير كلمة المرور')).toBeInTheDocument()
      expect(screen.queryByText('مشكلة في تحميل خطة المادة')).not.toBeInTheDocument()
    })




  })

  it('displays friendly empty state when no tickets match', async () => {
    server.use(http.get(`${env.apiBaseUrl}/support/staff/tickets`, () => HttpResponse.json([])))

    renderPage()

    expect(await screen.findByText('لا يوجد طلبات دعم')).toBeInTheDocument()
    expect(screen.getByText('لم يتم استلام أي طلبات دعم من الطلاب حتى الآن.')).toBeInTheDocument()
  })
})
