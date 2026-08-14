import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'
import { Route, Routes } from 'react-router'
import { env } from '../../../shared/lib/env'
import { server } from '../../../testing/mocks/server'
import { renderWithProviders } from '../../../testing/renderWithProviders'
import type { AuthContextValue } from '../../auth/context/AuthContext'
import { DiscussionDetailPage } from './DiscussionDetailPage'

const studentAuth: AuthContextValue = {
  user: { id: 'student-1', email: 's@example.com', fullName: 'محمد', role: 'student', avatarUrl: null },
  isLoading: false,
  login: vi.fn(),
  logout: vi.fn(),
  register: vi.fn(),
  verifyOtp: vi.fn(),
  updateUser: vi.fn(),
}

const threadDetail = {
  id: 'thread-1',
  courseId: 'course-1',
  title: 'قانون كولوم مش واضح',
  author: { id: 'student-1', fullName: 'محمد', avatarUrl: null, role: 'student' },
  tags: ['فيزياء'],
  replyCount: 1,
  helpfulCount: 0,
  isHelpfulByMe: false,
  isPinned: false,
  isAnswered: false,
  createdAt: '2026-01-01T10:00:00Z',
  body: 'ممكن حد يشرحلي قانون كولوم؟',
  attachments: [],
  canAccept: true,
  canPin: false,
  replies: [
    {
      id: 'reply-1',
      author: { id: 'teacher-1', fullName: 'المدرس', avatarUrl: null, role: 'teacher' },
      body: 'قانون كولوم بيوصف القوة بين شحنتين...',
      isAccepted: false,
      createdAt: '2026-01-01T11:00:00Z',
    },
  ],
}

function renderPage() {
  return renderWithProviders(
    <Routes>
      <Route path="/student/discussions/:threadId" element={<DiscussionDetailPage />} />
    </Routes>,
    { initialEntries: ['/student/discussions/thread-1'], auth: studentAuth },
  )
}

describe('DiscussionDetailPage', () => {
  it('marks a teacher reply as visually distinguishable from a student reply', async () => {
    server.use(
      http.get(`${env.apiBaseUrl}/discussions/thread-1`, () => HttpResponse.json(threadDetail)),
    )

    renderPage()

    expect(await screen.findByText('قانون كولوم بيوصف القوة بين شحنتين...')).toBeInTheDocument()
    expect(screen.getAllByText('المدرس').length).toBeGreaterThan(0)
  })

  it('lets the question author accept a reply as the answer, marking the thread answered', async () => {
    let isAccepted = false
    server.use(
      http.get(`${env.apiBaseUrl}/discussions/thread-1`, () =>
        HttpResponse.json({
          ...threadDetail,
          isAnswered: isAccepted,
          replies: [{ ...threadDetail.replies[0], isAccepted }],
        }),
      ),
    )
    server.use(
      http.post(`${env.apiBaseUrl}/discussions/thread-1/accept/reply-1`, () => {
        isAccepted = true
        return HttpResponse.json({
          ...threadDetail,
          isAnswered: true,
          replies: [{ ...threadDetail.replies[0], isAccepted: true }],
        })
      }),
    )

    const user = userEvent.setup()
    renderPage()

    await screen.findByText('قانون كولوم بيوصف القوة بين شحنتين...')
    await user.click(screen.getByRole('button', { name: 'اعتماد كإجابة' }))

    expect(await screen.findByText('إجابة مقبولة')).toBeInTheDocument()
  })

  it('lets the question author unaccept an accepted reply', async () => {
    let isAccepted = true
    server.use(
      http.get(`${env.apiBaseUrl}/discussions/thread-1`, () =>
        HttpResponse.json({
          ...threadDetail,
          isAnswered: isAccepted,
          replies: [{ ...threadDetail.replies[0], isAccepted }],
        }),
      ),
    )
    server.use(
      http.delete(`${env.apiBaseUrl}/discussions/thread-1/accept/reply-1`, () => {
        isAccepted = false
        return HttpResponse.json({
          ...threadDetail,
          isAnswered: false,
          replies: [{ ...threadDetail.replies[0], isAccepted: false }],
        })
      }),
    )

    const user = userEvent.setup()
    renderPage()

    await screen.findByText('إجابة مقبولة')
    await user.click(screen.getByRole('button', { name: 'إلغاء الاعتماد' }))

    expect(await screen.findByRole('button', { name: 'اعتماد كإجابة' })).toBeInTheDocument()
  })

  it('does not offer the accept-answer action to someone other than the question author', async () => {
    server.use(
      http.get(`${env.apiBaseUrl}/discussions/thread-1`, () =>
        HttpResponse.json({ ...threadDetail, canAccept: false }),
      ),
    )

    renderPage()

    await screen.findByText('قانون كولوم بيوصف القوة بين شحنتين...')
    expect(screen.queryByRole('button', { name: 'اعتماد كإجابة' })).not.toBeInTheDocument()
  })

  it('renders decoded Arabic attachment names correctly', async () => {
    const arabicBytes = [
      0xd8, 0xa7, 0xd9, 0x84, 0xd9, 0x83, 0xd9, 0x8a, 0xd9, 0x85, 0xd9, 0x8a, 0xd8, 0xa7, 0xd8, 0xa1,
    ]
    const mojibakeFilename = String.fromCharCode(...arabicBytes) + '.pdf'

    server.use(
      http.get(`${env.apiBaseUrl}/discussions/thread-1`, () =>
        HttpResponse.json({
          ...threadDetail,
          attachments: [{ id: 'att-1', fileName: mojibakeFilename, fileUrl: 'https://example.com/att.pdf' }],
        }),
      ),
    )

    renderPage()

    expect(await screen.findByText('الكيمياء.pdf')).toBeInTheDocument()
  })

  it('does not render an empty state illustration when there are zero replies', async () => {
    server.use(
      http.get(`${env.apiBaseUrl}/discussions/thread-1`, () =>
        HttpResponse.json({ ...threadDetail, replies: [] }),
      ),
    )

    renderPage()

    expect(await screen.findByText('الردود (0)')).toBeInTheDocument()
    expect(screen.queryByText('لا توجد ردود بعد')).not.toBeInTheDocument()
  })
})

