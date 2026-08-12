import { screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'
import { env } from '../../../shared/lib/env'
import { server } from '../../../testing/mocks/server'
import { renderWithProviders } from '../../../testing/renderWithProviders'
import { StudentDashboardPage } from './StudentDashboardPage'

function renderPage() {
  return renderWithProviders(<StudentDashboardPage />, {
    initialEntries: ['/student/dashboard'],
    auth: {
      user: {
        id: 'student-1',
        email: 'student@example.com',
        fullName: 'عبدالله حبسه',
        role: 'student',
        avatarUrl: null,
      },
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      register: vi.fn(),
      updateUser: vi.fn(),
      verifyOtp: vi.fn(),
    },
  })
}

function mockDashboard(overrides: Record<string, unknown>) {
  server.use(
    http.get(`${env.apiBaseUrl}/student/dashboard`, () =>
      HttpResponse.json({
        student: {
          id: 'student-1',
          fullName: 'عبدالله حبسه',
          email: 'student@example.com',
          avatarUrl: null,
        },
        stats: { enrolledCoursesCount: 0, activeCoursesCount: 0, completedCoursesCount: 0 },
        overallProgressPercent: null,
        continueLearning: null,
        recentCourses: [],
        recentActivity: [],
        ...overrides,
      }),
    ),
    http.get(`${env.apiBaseUrl}/notifications`, () => HttpResponse.json([])),
  )
}

describe('StudentDashboardPage', () => {
  it('shows a loading skeleton while fetching the dashboard', () => {
    server.use(
      http.get(`${env.apiBaseUrl}/student/dashboard`, async () => new Promise(() => {})),
    )

    renderPage()
    expect(screen.getByTestId('student-home-skeleton')).toBeInTheDocument()
  })

  it('renders error state on API failure with a working retry', async () => {
    server.use(
      http.get(`${env.apiBaseUrl}/student/dashboard`, () =>
        HttpResponse.json({ message: 'Internal error' }, { status: 500 }),
      ),
    )

    renderPage()

    expect(await screen.findByRole('alert')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /إعادة المحاولة/i })).toBeInTheDocument()
  })

  it('greets the student by first name using real profile data', async () => {
    mockDashboard({})
    renderPage()

    expect(await screen.findByText('أهلاً عبدالله')).toBeInTheDocument()
  })

  it('shows the welcome empty state for a student with zero courses, and nothing else', async () => {
    mockDashboard({})
    renderPage()

    expect(await screen.findByText('أهلاً بك في CourseFlix')).toBeInTheDocument()
    expect(screen.getByText('ابدأ رحلتك التعليمية واكتشف دوراتك')).toBeInTheDocument()
    expect(screen.queryByText('استكمل التعلم')).not.toBeInTheDocument()
    expect(screen.queryByText('دوراتي')).not.toBeInTheDocument()
  })

  it('shows the Continue Learning card with a working resume link when a course is in progress', async () => {
    mockDashboard({
      stats: { enrolledCoursesCount: 2, activeCoursesCount: 2, completedCoursesCount: 0 },
      overallProgressPercent: 45,
      continueLearning: {
        courseId: 'course-1',
        courseTitle: 'الفيزياء الكهربية',
        coverImageUrl: null,
        gradeLevel: 'الصف الثالث الثانوي',
        progressPercent: 55,
        completedLessonsCount: 6,
        totalLessonsCount: 11,
        currentLesson: { id: 'lesson-6', title: 'قانون كولوم', lastVideoPosition: 1112 },
      },
    })
    renderPage()

    expect(await screen.findByText('الفيزياء الكهربية')).toBeInTheDocument()
    expect(screen.getByText('6 من 11 درس مكتمل')).toBeInTheDocument()
    const resumeLink = screen.getByRole('link', { name: /استكمل الآن/i })
    expect(resumeLink).toHaveAttribute('href', '/student/lessons/lesson-6')
  })

  it('shows a "no active course" fallback when the student has courses but none in progress', async () => {
    mockDashboard({
      stats: { enrolledCoursesCount: 2, activeCoursesCount: 2, completedCoursesCount: 0 },
      recentCourses: [
        {
          courseId: 'course-1',
          courseTitle: 'فيزياء',
          coverImageUrl: null,
          status: 'active',
          enrolledAt: '2026-07-27T08:00:00.000Z',
        },
      ],
    })
    renderPage()

    expect(await screen.findByText('لا يوجد تعلم مستمر حاليًا')).toBeInTheDocument()
    expect(screen.getByText('اختر دورة وابدأ من حيث تريد.')).toBeInTheDocument()
  })

  it('shows a congratulatory state when every enrolled course is completed', async () => {
    mockDashboard({
      stats: { enrolledCoursesCount: 2, activeCoursesCount: 0, completedCoursesCount: 2 },
      recentCourses: [
        {
          courseId: 'course-1',
          courseTitle: 'فيزياء',
          coverImageUrl: null,
          status: 'completed',
          enrolledAt: '2026-07-27T08:00:00.000Z',
        },
      ],
    })
    renderPage()

    expect(await screen.findByText('أحسنت! 🎉')).toBeInTheDocument()
    expect(screen.getByText('أكملت دوراتك الحالية.')).toBeInTheDocument()
  })

  it('renders learning statistics from real backend numbers', async () => {
    mockDashboard({
      stats: { enrolledCoursesCount: 3, activeCoursesCount: 2, completedCoursesCount: 1 },
      overallProgressPercent: 62,
      recentCourses: [
        {
          courseId: 'course-1',
          courseTitle: 'فيزياء',
          coverImageUrl: null,
          status: 'active',
          enrolledAt: '2026-07-27T08:00:00.000Z',
        },
      ],
    })
    renderPage()

    expect(await screen.findByText('62%')).toBeInTheDocument()

    const tileValue = (label: string) =>
      screen.getByText(label, { selector: '.tile .lbl' }).closest('.tile')?.querySelector('.num')
        ?.textContent

    expect(tileValue('دوراتي')).toBe('3')
    expect(tileValue('نشطة')).toBe('2')
    expect(tileValue('مكتملة')).toBe('1')
  })

  it('renders recent activity events from real data', async () => {
    mockDashboard({
      stats: { enrolledCoursesCount: 1, activeCoursesCount: 1, completedCoursesCount: 0 },
      recentCourses: [
        {
          courseId: 'course-1',
          courseTitle: 'فيزياء',
          coverImageUrl: null,
          status: 'active',
          enrolledAt: '2026-07-27T08:00:00.000Z',
        },
      ],
      recentActivity: [
        {
          type: 'lesson_completed',
          courseId: 'course-1',
          courseTitle: 'فيزياء',
          lessonTitle: 'قانون نيوتن الثالث',
          occurredAt: '2026-08-08T00:00:00.000Z',
        },
      ],
    })
    renderPage()

    expect(await screen.findByText('آخر نشاط')).toBeInTheDocument()
    expect(screen.getByText('أكملت درس "قانون نيوتن الثالث" في فيزياء')).toBeInTheDocument()
  })

  it('shows a notifications preview with a link to the full notifications page', async () => {
    mockDashboard({
      stats: { enrolledCoursesCount: 1, activeCoursesCount: 1, completedCoursesCount: 0 },
      recentCourses: [
        {
          courseId: 'course-1',
          courseTitle: 'فيزياء',
          coverImageUrl: null,
          status: 'active',
          enrolledAt: '2026-07-27T08:00:00.000Z',
        },
      ],
    })
    server.use(
      http.get(`${env.apiBaseUrl}/notifications`, () =>
        HttpResponse.json([
          {
            id: 'notif-1',
            type: 'announcement',
            title: 'إعلان مهم',
            message: 'محتوى الإعلان',
            relatedEntityType: null,
            relatedEntityId: null,
            isRead: false,
            createdAt: '2026-08-09T00:00:00.000Z',
          },
        ]),
      ),
    )
    renderPage()

    expect(await screen.findByText('آخر الإشعارات')).toBeInTheDocument()
    expect(screen.getByText('إعلان مهم')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /عرض الكل/i })).toHaveAttribute(
      'href',
      '/student/notifications',
    )
  })
})
