import { Route, Routes } from 'react-router'
import { screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'
import { env } from '../../../shared/lib/env'
import { server } from '../../../testing/mocks/server'
import { renderWithProviders } from '../../../testing/renderWithProviders'
import { StudentCourseDetailPage } from './StudentCourseDetailPage'

function renderPage() {
  return renderWithProviders(
    <Routes>
      <Route path="/student/courses/:courseId" element={<StudentCourseDetailPage />} />
    </Routes>,
    {
      initialEntries: ['/student/courses/course-1'],
      auth: {
        user: {
          id: 'student-1',
          email: 'student@example.com',
          fullName: 'طالب',
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
    },
  )
}

describe('StudentCourseDetailPage', () => {
  it('renders lesson quizzes directly after their related lesson', async () => {
    server.use(
      http.get(`${env.apiBaseUrl}/courses/course-1`, () =>
        HttpResponse.json({
          id: 'course-1',
          title: 'الميكانيكا الكلاسيكية',
          slug: 'mechanics',
          description: null,
          coverImageUrl: null,
          gradeLevel: null,
          status: 'published',
          teacher: {
            id: 'teacher-1',
            fullName: 'أ. سارة',
          },
          canEdit: false,
          sections: [
            {
              id: 'section-1',
              title: 'قوانين نيوتن',
              sortOrder: 1,
              status: 'published',
              lessons: [
                {
                  id: 'lesson-1',
                  title: 'القانون الأول',
                  videoUrl: 'https://example.com/video.mp4',
                  sortOrder: 1,
                  status: 'published',
                },
              ],
            },
          ],
        }),
      ),
      http.get(`${env.apiBaseUrl}/courses/course-1/quizzes`, () =>
        HttpResponse.json([
          {
            id: 'quiz-1',
            title: 'اختبار القانون الأول',
            courseId: 'course-1',
            sectionId: 'section-1',
            lessonId: 'lesson-1',
            questionCount: 2,
            submission: null,
          },
        ]),
      ),
    )

    renderPage()

    await screen.findByRole('link', { name: /اختبار القانون الأول/ })
    const lessonLink = screen
      .getAllByRole('link')
      .find((link) => link.getAttribute('href') === '/student/lessons/lesson-1')
    const quizLink = await screen.findByRole('link', { name: /اختبار القانون الأول/ })

    expect(lessonLink).toBeDefined()
    expect(quizLink).toHaveAttribute('href', '/student/quizzes/quiz-1')
    expect(lessonLink!.compareDocumentPosition(quizLink)).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
    expect(screen.getByText(/اختبار بعد الدرس/)).toBeInTheDocument()
  })
})
