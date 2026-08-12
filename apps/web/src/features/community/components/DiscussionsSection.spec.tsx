import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'
import { Route, Routes } from 'react-router'
import { env } from '../../../shared/lib/env'
import { server } from '../../../testing/mocks/server'
import { renderWithProviders } from '../../../testing/renderWithProviders'
import type { AuthContextValue } from '../../auth/context/AuthContext'
import { DiscussionsSection } from './DiscussionsSection'

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

function renderSection(auth: AuthContextValue = studentAuth) {
  return renderWithProviders(
    <Routes>
      <Route path="/student/courses/:courseId" element={<DiscussionsSection courseId="course-1" />} />
    </Routes>,
    { initialEntries: ['/student/courses/course-1'], auth },
  )
}

const sampleThread = {
  id: 'thread-1',
  courseId: 'course-1',
  title: 'قانون كولوم مش واضح',
  author: { id: 'student-2', fullName: 'أحمد', avatarUrl: null, role: 'student' },
  tags: ['فيزياء'],
  replyCount: 2,
  helpfulCount: 3,
  isHelpfulByMe: false,
  isPinned: false,
  isAnswered: false,
  createdAt: '2026-01-01T10:00:00Z',
}

describe('DiscussionsSection', () => {
  it('renders the list of discussions for the course', async () => {
    server.use(
      http.get(`${env.apiBaseUrl}/courses/course-1/discussions`, () => HttpResponse.json([sampleThread])),
    )

    renderSection()

    expect(await screen.findByText('قانون كولوم مش واضح')).toBeInTheDocument()
    expect(screen.getByText(/أحمد/)).toBeInTheDocument()
    // "بدون إجابة" also appears as a filter tab label, so scope to the card itself.
    const card = screen.getByText('قانون كولوم مش واضح').closest('a')!
    expect(within(card).getByText('بدون إجابة')).toBeInTheDocument()
  })

  it('shows an empty state with a call to action when there are no questions', async () => {
    server.use(http.get(`${env.apiBaseUrl}/courses/course-1/discussions`, () => HttpResponse.json([])))

    renderSection()

    expect(await screen.findByText('لا يوجد أسئلة بعد')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /اسأل أول سؤال/ })).toBeInTheDocument()
  })

  it('shows a search-specific empty state with a clear-search action', async () => {
    let lastSearch: string | null = null
    server.use(
      http.get(`${env.apiBaseUrl}/courses/course-1/discussions`, ({ request }) => {
        lastSearch = new URL(request.url).searchParams.get('search')
        return HttpResponse.json(lastSearch ? [] : [sampleThread])
      }),
    )

    const user = userEvent.setup()
    renderSection()

    await screen.findByText('قانون كولوم مش واضح')

    await user.type(screen.getByPlaceholderText('ابحث في المناقشات...'), 'لا يوجد نتيجة')
    await user.keyboard('{Enter}')

    expect(await screen.findByText('لم نجد أي مناقشات مطابقة لبحثك')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'مسح البحث' })[0]).toBeInTheDocument()
  })

  it('lets a student ask a question and posts it as multipart form data', async () => {
    server.use(
      http.get(`${env.apiBaseUrl}/courses/course-1/discussions`, () => HttpResponse.json([])),
    )

    let posted: { title: string | null; body: string | null } | null = null
    server.use(
      http.post(`${env.apiBaseUrl}/courses/course-1/discussions`, async ({ request }) => {
        const formData = await request.formData()
        posted = {
          title: formData.get('title') as string | null,
          body: formData.get('body') as string | null,
        }
        return HttpResponse.json({ ...sampleThread, id: 'thread-2', title: posted.title })
      }),
    )

    const user = userEvent.setup()
    renderSection()

    await screen.findByText('لا يوجد أسئلة بعد')

    await user.click(screen.getByRole('button', { name: /اسأل سؤال/ }))
    const dialog = await screen.findByRole('dialog', { hidden: true })
    await user.type(within(dialog).getByLabelText('عنوان السؤال'), 'مشكلة في حل المسألة الثالثة')
    await user.type(within(dialog).getByLabelText('تفاصيل السؤال'), 'مش عارف أكمل الحل')
    await user.click(within(dialog).getByRole('button', { name: 'نشر السؤال' }))

    await waitFor(() => {
      expect(posted).not.toBeNull()
    })
    expect(posted).toEqual({ title: 'مشكلة في حل المسألة الثالثة', body: 'مش عارف أكمل الحل' })
  })

  it('does not show the "ask a question" button for a teacher viewer', async () => {
    server.use(
      http.get(`${env.apiBaseUrl}/courses/course-1/discussions`, () => HttpResponse.json([sampleThread])),
    )

    renderSection({
      ...studentAuth,
      user: { ...studentAuth.user!, role: 'teacher' },
    })

    await screen.findByText('قانون كولوم مش واضح')
    expect(screen.queryByRole('button', { name: /اسأل سؤال/ })).not.toBeInTheDocument()
  })
})
