import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { Route, Routes } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { env } from '../../../shared/lib/env'
import { server } from '../../../testing/mocks/server'
import { renderWithProviders } from '../../../testing/renderWithProviders'
import type { AuthContextValue } from '../../auth/context/AuthContext'
import { StudentCommunityPage } from './StudentCommunityPage'

const studentAuth: AuthContextValue = {
  user: { id: 'student-1', email: 's@example.com', fullName: 'محمد', role: 'student', avatarUrl: null },
  isLoading: false,
  login: vi.fn(),
  logout: vi.fn(),
  register: vi.fn(),
  verifyOtp: vi.fn(),
  updateUser: vi.fn(),
}

const chemistryEnrollment = {
  id: 'enroll-1',
  courseId: 'course-1',
  courseTitle: 'الكيمياء العضوية',
  coverImageUrl: null,
  gradeLevel: 'الصف الأول الثانوي',
  status: 'active',
  progressPercent: 40,
  completedLessonsCount: 4,
  totalLessonsCount: 10,
  currentLesson: null,
  lastActivityAt: '2026-08-01T10:00:00Z',
}

const physicsEnrollment = {
  ...chemistryEnrollment,
  id: 'enroll-2',
  courseId: 'course-2',
  courseTitle: 'الفيزياء',
  gradeLevel: 'الصف الثالث الثانوي',
}

function mockEnrollments(enrollments: unknown[]) {
  server.use(
    http.get(`${env.apiBaseUrl}/student/enrollments`, () => HttpResponse.json(enrollments)),
    http.get(`${env.apiBaseUrl}/notifications/unread-count`, () => HttpResponse.json({ count: 0 })),
  )
}

function mockSummary(summary: unknown[]) {
  server.use(
    http.get(`${env.apiBaseUrl}/student/community/summary`, () => HttpResponse.json(summary)),
  )
}

function renderPage() {
  return renderWithProviders(
    <Routes>
      <Route path="/student/community" element={<StudentCommunityPage />} />
    </Routes>,
    { initialEntries: ['/student/community'], auth: studentAuth },
  )
}

describe('StudentCommunityPage', () => {
  it('shows page title and subtitle', async () => {
    mockEnrollments([chemistryEnrollment])
    mockSummary([])
    renderPage()
    expect(await screen.findByText('المجتمع')).toBeInTheDocument()
    expect(await screen.findByText(/تواصل مع زملائك في كل دورة/)).toBeInTheDocument()
  })

  it('renders a row for each active enrollment with grade, preview, and unread badge', async () => {
    mockEnrollments([chemistryEnrollment])
    mockSummary([
      {
        courseId: 'course-1',
        preview: 'أحمد: عندي سؤال في الفصل الثالث',
        lastActivityAt: '2026-08-10T10:00:00Z',
        unreadCount: 3,
      },
    ])
    renderPage()

    expect(await screen.findByText('الكيمياء العضوية')).toBeInTheDocument()
    expect(screen.getByText('الصف الأول الثانوي')).toBeInTheDocument()
    expect(screen.getByText(/أحمد: عندي سؤال/)).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()

    const row = screen.getByText('الكيمياء العضوية').closest('a')
    expect(row).toHaveAttribute('href', '/student/community/course-1')
  })

  it('falls back to a neutral message when a course has no community activity yet', async () => {
    mockEnrollments([chemistryEnrollment])
    mockSummary([{ courseId: 'course-1', preview: null, lastActivityAt: null, unreadCount: 0 }])
    renderPage()

    expect(await screen.findByText('لا توجد رسائل جديدة')).toBeInTheDocument()
    expect(screen.queryByText(/^\d+$/)).not.toBeInTheDocument()
  })

  it('sorts courses by most recent community activity first', async () => {
    mockEnrollments([chemistryEnrollment, physicsEnrollment])
    mockSummary([
      { courseId: 'course-1', preview: 'قديم', lastActivityAt: '2026-08-01T10:00:00Z', unreadCount: 0 },
      { courseId: 'course-2', preview: 'جديد', lastActivityAt: '2026-08-12T10:00:00Z', unreadCount: 0 },
    ])
    renderPage()

    const titles = (await screen.findAllByText(/الكيمياء العضوية|الفيزياء/)).map((el) => el.textContent)
    expect(titles).toEqual(['الفيزياء', 'الكيمياء العضوية'])
  })

  it('filters the course list by the search input', async () => {
    mockEnrollments([chemistryEnrollment, physicsEnrollment])
    mockSummary([])
    const user = userEvent.setup()
    renderPage()

    expect(await screen.findByText('الفيزياء')).toBeInTheDocument()

    await user.type(screen.getByLabelText('ابحث عن دورة'), 'كيمياء')

    expect(screen.getByText('الكيمياء العضوية')).toBeInTheDocument()
    expect(screen.queryByText('الفيزياء')).not.toBeInTheDocument()
  })

  it('renders a locked row instead of a link for a course with no title', async () => {
    mockEnrollments([{ ...chemistryEnrollment, courseTitle: undefined }])
    mockSummary([])
    renderPage()

    expect(await screen.findByText('الدورة غير متاحة')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /غير متاحة/ })).not.toBeInTheDocument()
  })

  it('shows skeleton while loading', () => {
    server.use(
      // Deliberately never resolves to keep skeleton on screen
      http.get(`${env.apiBaseUrl}/student/enrollments`, async () => {
        await new Promise(() => {})
        return HttpResponse.json([])
      }),
      http.get(`${env.apiBaseUrl}/notifications/unread-count`, () => HttpResponse.json({ count: 0 })),
    )
    mockSummary([])
    renderPage()
    expect(screen.getByTestId('community-skeleton')).toBeInTheDocument()
  })

  it('shows a compact empty state when there are no enrollments', async () => {
    mockEnrollments([])
    mockSummary([])
    renderPage()
    expect(await screen.findByText('لا توجد مجتمعات متاحة')).toBeInTheDocument()
    expect(screen.getByText('اشترك في دورة للانضمام إلى مجتمعها')).toBeInTheDocument()
  })
})
