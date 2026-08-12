import { screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'
import { env } from '../../../shared/lib/env'
import { server } from '../../../testing/mocks/server'
import { renderWithProviders } from '../../../testing/renderWithProviders'
import { StudentCoursesPage } from './StudentCoursesPage'

function renderPage() {
  return renderWithProviders(<StudentCoursesPage />, {
    initialEntries: ['/student/courses'],
    auth: {
      user: {
        id: 'student-1',
        email: 'student@example.com',
        fullName: 'طالب الفيزياء',
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

describe('StudentCoursesPage', () => {
  it('shows loading skeleton while fetching enrollments', () => {
    server.use(
      http.get(`${env.apiBaseUrl}/student/enrollments`, async () => {
        return new Promise(() => {})
      }),
    )

    renderPage()
    expect(screen.getByTestId('student-courses-skeleton')).toBeInTheDocument()
  })

  it('renders error state on API failure', async () => {
    server.use(
      http.get(`${env.apiBaseUrl}/student/enrollments`, () => {
        return HttpResponse.json({ message: 'Internal error' }, { status: 500 })
      }),
    )

    renderPage()

    expect(await screen.findByRole('alert')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /إعادة المحاولة/i })).toBeInTheDocument()
  })

  it('renders empty state when student has no enrollments', async () => {
    server.use(
      http.get(`${env.apiBaseUrl}/student/enrollments`, () => {
        return HttpResponse.json([])
      }),
    )

    renderPage()

    expect(await screen.findByText('لسه مفيش دورات هنا')).toBeInTheDocument()
    expect(screen.getByText('لما تنضم لدورة هتظهر هنا')).toBeInTheDocument()
  })

  it('renders Continue Learning section and course cards with progress and correct CTAs', async () => {
    server.use(
      http.get(`${env.apiBaseUrl}/student/enrollments`, () => {
        return HttpResponse.json([
          {
            id: 'enr-1',
            courseId: 'course-1',
            courseTitle: 'الفيزياء الكهربية',
            coverImageUrl: 'https://example.com/physics.png',
            gradeLevel: 'الصف الثالث الثانوي',
            status: 'active',
            progressPercent: 55,
            completedLessonsCount: 6,
            totalLessonsCount: 11,
            currentLesson: {
              id: 'lesson-6',
              title: 'قانون كولوم',
              lastVideoPosition: 1112,
            },
            lastActivityAt: '2026-08-09T18:00:00.000Z',
          },
          {
            id: 'enr-2',
            courseId: 'course-2',
            courseTitle: 'الكيمياء الحرارية',
            coverImageUrl: null,
            gradeLevel: 'الصف الثاني الثانوي',
            status: 'completed',
            progressPercent: 100,
            completedLessonsCount: 8,
            totalLessonsCount: 8,
            currentLesson: null,
            lastActivityAt: '2026-08-01T10:00:00.000Z',
          },
        ])
      }),
    )

    renderPage()

    // Continue learning section assertions
    expect(await screen.findByRole('region', { name: 'استكمل التعلم' })).toBeInTheDocument()
    expect(screen.getByText('قيد التعلم الحالي')).toBeInTheDocument()
    expect(screen.getAllByText('55%').length).toBeGreaterThan(0)
    expect(screen.getAllByText('6 من 11 درس مكتمل').length).toBeGreaterThan(0)

    // Resume button links directly to current lesson
    const continueLinks = screen.getAllByRole('link', { name: /استكمل الآن/i })
    expect(continueLinks.length).toBeGreaterThan(0)
    expect(continueLinks[0]).toHaveAttribute('href', '/student/lessons/lesson-6')

    // Active-learning indicator on the course card itself
    expect(screen.getByText('تتعلم الآن')).toBeInTheDocument()

    // Completed course card
    expect(screen.getByText('الكيمياء الحرارية')).toBeInTheDocument()
    const reviewBtn = screen.getByRole('link', { name: /مراجعة الدورة/i })
    expect(reviewBtn).toHaveAttribute('href', '/student/courses/course-2')
  })

  it('shows a not-started CTA and no progress bar for a course with zero lessons watched', async () => {
    server.use(
      http.get(`${env.apiBaseUrl}/student/enrollments`, () => {
        return HttpResponse.json([
          {
            id: 'enr-3',
            courseId: 'course-3',
            courseTitle: 'الميكانيكا',
            coverImageUrl: null,
            gradeLevel: 'الصف الأول الثانوي',
            status: 'active',
            progressPercent: 0,
            completedLessonsCount: 0,
            totalLessonsCount: 5,
            currentLesson: { id: 'lesson-1', title: 'مقدمة في الميكانيكا', lastVideoPosition: 0 },
            lastActivityAt: '2026-08-01T10:00:00.000Z',
          },
        ])
      }),
    )

    renderPage()

    expect(await screen.findByText('الميكانيكا')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /ابدأ الآن/i })).toHaveAttribute(
      'href',
      '/student/lessons/lesson-1',
    )
    // Not started: no active Continue Learning section for this course.
    expect(screen.queryByRole('region', { name: 'استكمل التعلم' })).not.toBeInTheDocument()
  })
})
