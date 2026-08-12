import { screen } from '@testing-library/react'
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

const sampleEnrollment = {
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
    server.use(
      http.get(`${env.apiBaseUrl}/student/enrollments`, () => HttpResponse.json([sampleEnrollment])),
      http.get(`${env.apiBaseUrl}/notifications/unread-count`, () => HttpResponse.json({ count: 0 })),
    )
    renderPage()
    expect(await screen.findByText('المجتمع')).toBeInTheDocument()
    expect(await screen.findByText(/تواصل مع زملائك ومدرسك/)).toBeInTheDocument()
  })

  it('renders a course card for each active enrollment, with a section heading and count', async () => {
    server.use(
      http.get(`${env.apiBaseUrl}/student/enrollments`, () => HttpResponse.json([sampleEnrollment])),
      http.get(`${env.apiBaseUrl}/notifications/unread-count`, () => HttpResponse.json({ count: 0 })),
    )
    renderPage()
    expect(await screen.findByText('دوراتك')).toBeInTheDocument()
    expect(screen.getByText('1 دورة')).toBeInTheDocument()
    expect(screen.getByText('الكيمياء العضوية')).toBeInTheDocument()
    expect(screen.getByText('الصف الأول الثانوي')).toBeInTheDocument()
    expect(screen.getByText('دخول المجتمع')).toBeInTheDocument()

    const card = screen.getByText('الكيمياء العضوية').closest('a')
    expect(card).toHaveAttribute('href', '/student/community/course-1')
  })

  it('renders a locked card instead of a link for a course with no title', async () => {
    server.use(
      http.get(`${env.apiBaseUrl}/student/enrollments`, () =>
        HttpResponse.json([{ ...sampleEnrollment, courseTitle: undefined }]),
      ),
      http.get(`${env.apiBaseUrl}/notifications/unread-count`, () => HttpResponse.json({ count: 0 })),
    )
    renderPage()
    expect(await screen.findByText('الدورة غير متاحة')).toBeInTheDocument()
    expect(screen.queryByText('دخول المجتمع')).not.toBeInTheDocument()
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
    renderPage()
    expect(screen.getByTestId('community-skeleton')).toBeInTheDocument()
  })

  it('shows empty state when no enrollments', async () => {
    server.use(
      http.get(`${env.apiBaseUrl}/student/enrollments`, () => HttpResponse.json([])),
      http.get(`${env.apiBaseUrl}/notifications/unread-count`, () => HttpResponse.json({ count: 0 })),
    )
    renderPage()
    expect(await screen.findByText('لا توجد دورات متاحة')).toBeInTheDocument()
  })
})
