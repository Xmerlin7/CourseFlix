import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { Route, Routes } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { env } from '../../../shared/lib/env'
import { server } from '../../../testing/mocks/server'
import { renderWithProviders } from '../../../testing/renderWithProviders'
import type { AuthContextValue } from '../../auth/context/AuthContext'
import { StudentCourseCommunityPage } from './StudentCourseCommunityPage'

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
  courseTitle: 'الفيزياء النووية',
  coverImageUrl: null,
  gradeLevel: null,
  status: 'active',
  progressPercent: 25,
  completedLessonsCount: 2,
  totalLessonsCount: 8,
  currentLesson: null,
  lastActivityAt: '2026-08-01T10:00:00Z',
}

function renderPage(courseId = 'course-1') {
  return renderWithProviders(
    <Routes>
      <Route path="/student/community/:courseId" element={<StudentCourseCommunityPage />} />
    </Routes>,
    { initialEntries: [`/student/community/${courseId}`], auth: studentAuth },
  )
}

describe('StudentCourseCommunityPage', () => {
  it('renders the back button and course title', async () => {
    server.use(
      http.get(`${env.apiBaseUrl}/student/enrollments`, () => HttpResponse.json([sampleEnrollment])),
      http.get(`${env.apiBaseUrl}/courses/course-1/discussions`, () => HttpResponse.json([])),
      http.get(`${env.apiBaseUrl}/notifications/unread-count`, () => HttpResponse.json({ count: 0 })),
    )
    renderPage()
    expect(await screen.findByText('الفيزياء النووية')).toBeInTheDocument()
    const backLink = screen.getByRole('link', { name: /العودة إلى صفحة المجتمع/ })
    expect(backLink).toHaveAttribute('href', '/student/community')
  })

  it('shows the discussions tab content by default', async () => {
    server.use(
      http.get(`${env.apiBaseUrl}/student/enrollments`, () => HttpResponse.json([sampleEnrollment])),
      http.get(`${env.apiBaseUrl}/courses/course-1/discussions`, () => HttpResponse.json([])),
      http.get(`${env.apiBaseUrl}/notifications/unread-count`, () => HttpResponse.json({ count: 0 })),
    )
    renderPage()
    const discussionsTab = await screen.findByRole('tab', { name: /المناقشات/ })
    expect(discussionsTab).toHaveAttribute('aria-selected', 'true')
    // Empty state from DiscussionsSection
    expect(await screen.findByText('لا يوجد أسئلة بعد')).toBeInTheDocument()
  })

  it('switches to the announcements tab', async () => {
    server.use(
      http.get(`${env.apiBaseUrl}/student/enrollments`, () => HttpResponse.json([sampleEnrollment])),
      http.get(`${env.apiBaseUrl}/courses/course-1/discussions`, () => HttpResponse.json([])),
      http.get(`${env.apiBaseUrl}/courses/course-1/announcements`, () => HttpResponse.json([])),
      http.get(`${env.apiBaseUrl}/notifications/unread-count`, () => HttpResponse.json({ count: 0 })),
    )
    const user = userEvent.setup()
    renderPage()
    const announcementsTab = await screen.findByRole('tab', { name: /الإعلانات/ })
    await user.click(announcementsTab)
    expect(announcementsTab).toHaveAttribute('aria-selected', 'true')
    expect(await screen.findByText('لا توجد إعلانات بعد')).toBeInTheDocument()
  })
})
