import { Route, Routes } from 'react-router'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'
import { env } from '../../../shared/lib/env'
import { server } from '../../../testing/mocks/server'
import { renderWithProviders } from '../../../testing/renderWithProviders'
import type { AuthContextValue } from '../../auth/context/AuthContext'
import { StudentLessonPage } from './StudentLessonPage'

function renderPage(
  initialEntries = ['/student/lessons/lesson-1'],
  auth?: AuthContextValue,
) {
  return renderWithProviders(
    <Routes>
      <Route path="/student/lessons/:lessonId" element={<StudentLessonPage />} />
      <Route path="/teacher/lessons/:lessonId" element={<StudentLessonPage />} />
    </Routes>,
    { initialEntries, auth },
  )
}

describe('StudentLessonPage', () => {
  const studentAuth: AuthContextValue = {
    user: {
      id: '6205c1fd-034c-4700-8a96-f79a6de16bb0',
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
  }

  it('renders YouTube lesson URLs as an embedded player', async () => {
    server.use(
      http.get(`${env.apiBaseUrl}/lessons/lesson-1`, () =>
        HttpResponse.json({
          id: 'lesson-1',
          title: 'قانون نيوتن الأول',
          video: {
            id: 'video-1',
            url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            durationSeconds: null,
          },
          course: {
            id: 'course-1',
            title: 'فيزياء',
            currentSectionId: 'section-1',
            sections: [
              {
                id: 'section-1',
                title: 'الحركة',
                sortOrder: 1,
                lessons: [
                  { id: 'lesson-1', title: 'قانون نيوتن الأول', sortOrder: 1 },
                  { id: 'lesson-2', title: 'قانون نيوتن الثاني', sortOrder: 2 },
                ],
              },
            ],
          },
          progress: {
            lastPositionSeconds: 0,
            watchedPercentage: 0,
            status: 'not_started',
          },
        }),
      ),
    )

    renderPage()

    const player = await screen.findByTitle('قانون نيوتن الأول')
    expect(player).toHaveAttribute(
      'src',
      'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?rel=0&modestbranding=1&iv_load_policy=3&playsinline=1&enablejsapi=1&controls=0&disablekb=1',
    )
  })

  it('shows a subtle student id watermark over the player', async () => {
    server.use(
      http.get(`${env.apiBaseUrl}/lessons/lesson-1`, () =>
        HttpResponse.json({
          id: 'lesson-1',
          title: 'قانون نيوتن الأول',
          video: {
            id: 'video-1',
            url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            durationSeconds: null,
          },
          course: {
            id: 'course-1',
            title: 'فيزياء',
            currentSectionId: 'section-1',
            sections: [
              {
                id: 'section-1',
                title: 'الحركة',
                sortOrder: 1,
                lessons: [{ id: 'lesson-1', title: 'قانون نيوتن الأول', sortOrder: 1 }],
              },
            ],
          },
          progress: {
            lastPositionSeconds: 0,
            watchedPercentage: 0,
            status: 'not_started',
          },
        }),
      ),
    )

    renderPage(['/student/lessons/lesson-1'], studentAuth)

    expect(await screen.findByTestId('student-video-watermark')).toHaveTextContent(
      'ID 6205C1FD03',
    )
    expect(screen.getAllByText('ID 6205C1FD03')).toHaveLength(10)
  })

  it('renders Bunny Stream iframe embed codes as an embedded player', async () => {
    const bunnyEmbed =
      '<div style="position:relative;padding-top:56.25%;"><iframe src="https://player.mediadelivery.net/embed/663132/b40c3ee1-00ee-4fd8-ab8e-2e0993b11030?autoplay=true&amp;loop=false&amp;muted=true&amp;preload=true&amp;responsive=true" loading="lazy"></iframe></div>'

    server.use(
      http.get(`${env.apiBaseUrl}/lessons/lesson-1`, () =>
        HttpResponse.json({
          id: 'lesson-1',
          title: 'درس Bunny',
          video: {
            id: 'video-1',
            url: bunnyEmbed,
            durationSeconds: null,
          },
          course: {
            id: 'course-1',
            title: 'فيزياء',
            currentSectionId: 'section-1',
            sections: [
              {
                id: 'section-1',
                title: 'الحركة',
                sortOrder: 1,
                lessons: [{ id: 'lesson-1', title: 'درس Bunny', sortOrder: 1 }],
              },
            ],
          },
          progress: {
            lastPositionSeconds: 0,
            watchedPercentage: 0,
            status: 'not_started',
          },
        }),
      ),
    )

    renderPage()

    const player = await screen.findByTitle('درس Bunny')
    expect(player).toHaveAttribute(
      'src',
      'https://player.mediadelivery.net/embed/663132/b40c3ee1-00ee-4fd8-ab8e-2e0993b11030?autoplay=true&loop=false&muted=true&preload=true&responsive=true',
    )
  })

  it('sends progress heartbeats for embedded YouTube and Bunny players', async () => {
    let progressPayload: unknown
    const setIntervalSpy = vi
      .spyOn(globalThis, 'setInterval')
      .mockImplementation((handler: TimerHandler) => {
        if (typeof handler === 'function') {
          handler()
        }
        return 1 as unknown as ReturnType<typeof setInterval>
      })

    server.use(
      http.get(`${env.apiBaseUrl}/lessons/lesson-1`, () =>
        HttpResponse.json({
          id: 'lesson-1',
          title: 'درس Bunny',
          video: {
            id: 'video-1',
            url: 'https://player.mediadelivery.net/embed/663132/b40c3ee1-00ee-4fd8-ab8e-2e0993b11030',
            durationSeconds: null,
          },
          course: {
            id: 'course-1',
            title: 'فيزياء',
            currentSectionId: 'section-1',
            sections: [
              {
                id: 'section-1',
                title: 'الحركة',
                sortOrder: 1,
                lessons: [{ id: 'lesson-1', title: 'درس Bunny', sortOrder: 1 }],
              },
            ],
          },
          progress: {
            lastPositionSeconds: 0,
            watchedPercentage: 0,
            status: 'not_started',
          },
        }),
      ),
      http.post(`${env.apiBaseUrl}/lessons/lesson-1/progress`, async ({ request }) => {
        progressPayload = await request.json()
        return HttpResponse.json({
          watchedPercentage: 2.5,
          status: 'in_progress',
          attendanceAwarded: false,
        })
      }),
    )

    try {
      renderPage()
      expect(await screen.findByTitle('درس Bunny')).toBeInTheDocument()

      await waitFor(() => {
        expect(progressPayload).toEqual({
          positionSeconds: 15,
          watchedSeconds: 15,
          durationSeconds: 600,
        })
      })
      expect(screen.getByText('3%')).toBeInTheDocument()
    } finally {
      setIntervalSpy.mockRestore()
    }
  })

  it('marks completed lessons in the course playlist', async () => {
    server.use(
      http.get(`${env.apiBaseUrl}/lessons/lesson-1`, () =>
        HttpResponse.json({
          id: 'lesson-1',
          title: 'قانون نيوتن الأول',
          video: {
            id: 'video-1',
            url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            durationSeconds: null,
          },
          course: {
            id: 'course-1',
            title: 'فيزياء',
            currentSectionId: 'section-1',
            sections: [
              {
                id: 'section-1',
                title: 'الحركة',
                sortOrder: 1,
                lessons: [
                  {
                    id: 'lesson-1',
                    title: 'قانون نيوتن الأول',
                    sortOrder: 1,
                    progressStatus: 'in_progress',
                    watchedPercentage: 30,
                  },
                  {
                    id: 'lesson-2',
                    title: 'درس مكتمل',
                    sortOrder: 2,
                    progressStatus: 'completed',
                    watchedPercentage: 100,
                  },
                ],
              },
            ],
          },
          progress: {
            lastPositionSeconds: 0,
            watchedPercentage: 30,
            status: 'in_progress',
          },
        }),
      ),
    )

    renderPage()

    await screen.findByText('تمت المشاهدة')
    const completedLesson = screen
      .getAllByRole('link')
      .find((link) => link.classList.contains('lesson-nav-item') && link.textContent?.includes('درس مكتمل'))

    if (!completedLesson) {
      throw new Error('completed playlist lesson was not rendered')
    }
    expect(completedLesson).toHaveTextContent('done_all')
    expect(completedLesson).toHaveTextContent('تمت المشاهدة')
  })

  it('shows the course lesson menu and highlights the current lesson for teachers', async () => {
    server.use(
      http.get(`${env.apiBaseUrl}/teacher/lessons/lesson-1/player`, () =>
        HttpResponse.json({
          id: 'lesson-1',
          title: 'قانون نيوتن الأول',
          video: {
            id: 'video-1',
            url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            durationSeconds: null,
          },
          course: {
            id: 'course-1',
            title: 'فيزياء',
            currentSectionId: 'section-1',
            sections: [
              {
                id: 'section-1',
                title: 'الحركة',
                sortOrder: 1,
                lessons: [
                  { id: 'lesson-1', title: 'قانون نيوتن الأول', sortOrder: 1 },
                  { id: 'lesson-2', title: 'قانون نيوتن الثاني', sortOrder: 2 },
                ],
              },
            ],
          },
          progress: {
            lastPositionSeconds: 0,
            watchedPercentage: 0,
            status: 'not_started',
          },
        }),
      ),
    )

    renderPage(['/teacher/lessons/lesson-1'], {
      user: {
        id: 'teacher-1',
        email: 'teacher@example.com',
        fullName: 'معلم الفيزياء',
        role: 'teacher',
        avatarUrl: null,
      },
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      register: vi.fn(),
      updateUser: vi.fn(),
      verifyOtp: vi.fn(),
    })

    expect(await screen.findByRole('heading', { name: 'فيزياء' })).toBeInTheDocument()
    expect(screen.getByRole('link', { current: 'page' })).toHaveTextContent('قانون نيوتن الأول')
    const nextLessonLinks = screen.getAllByRole('link', { name: /قانون نيوتن الثاني/ })
    expect(nextLessonLinks).toHaveLength(2)
    nextLessonLinks.forEach((link) => {
      expect(link).toHaveAttribute('href', '/teacher/lessons/lesson-2')
    })
    expect(screen.getByText('معاينة المدرس')).toBeInTheDocument()
  })

  it('locks next lesson when current progress is 0%, 55%, or 99%, and unlocks at 100%', async () => {
    const user = userEvent.setup()
    const buildCourse = (progressPercentage: number, status: 'not_started' | 'in_progress' | 'completed') => ({
      id: 'lesson-1',
      title: 'الدرس الأول',
      video: { id: 'v-1', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', durationSeconds: 100 },
      course: {
        id: 'c-1',
        title: 'دورة الفيزياء',
        currentSectionId: 's-1',
        sections: [
          {
            id: 's-1',
            title: 'الفصل الأول',
            sortOrder: 1,
            lessons: [
              { id: 'lesson-1', title: 'الدرس الأول', sortOrder: 1, progressStatus: status, watchedPercentage: progressPercentage },
              { id: 'lesson-2', title: 'الدرس الثاني', sortOrder: 2, progressStatus: 'not_started', watchedPercentage: 0 },
            ],
          },
        ],
      },
      progress: { lastPositionSeconds: 0, watchedPercentage: progressPercentage, status },
    })

    // 1. Progress = 55% -> Next lesson locked
    server.use(http.get(`${env.apiBaseUrl}/lessons/lesson-1`, () => HttpResponse.json(buildCourse(55, 'in_progress'))))
    const { unmount } = renderPage(['/student/lessons/lesson-1'], studentAuth)

    expect(await screen.findByRole('heading', { name: 'الدرس الأول' })).toBeInTheDocument()
    const lockedItems55 = screen.getAllByRole('link', { name: /مقفل/ })
    expect(lockedItems55.length).toBeGreaterThanOrEqual(1)
    await user.click(lockedItems55[0])
    expect(screen.getByText('أكمل مشاهدة الدرس الحالي بنسبة 100% لفتح الدرس التالي.')).toBeInTheDocument()
    unmount()

    // 2. Progress = 99% -> Still locked
    server.use(http.get(`${env.apiBaseUrl}/lessons/lesson-1`, () => HttpResponse.json(buildCourse(99, 'in_progress'))))
    const { unmount: unmount99 } = renderPage(['/student/lessons/lesson-1'], studentAuth)

    expect(await screen.findByRole('heading', { name: 'الدرس الأول' })).toBeInTheDocument()
    const lockedItems99 = screen.getAllByRole('link', { name: /مقفل/ })
    expect(lockedItems99.length).toBeGreaterThanOrEqual(1)
    unmount99()

    // 3. Progress = 100% -> Unlocked!
    server.use(http.get(`${env.apiBaseUrl}/lessons/lesson-1`, () => HttpResponse.json(buildCourse(100, 'completed'))))
    renderPage(['/student/lessons/lesson-1'], studentAuth)

    expect(await screen.findByRole('heading', { name: 'الدرس الأول' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /مقفل/ })).not.toBeInTheDocument()
    const nextLessonLinks = screen.getAllByRole('link', { name: /الدرس التالي/ })
    expect(nextLessonLinks.length).toBeGreaterThanOrEqual(1)
    nextLessonLinks.forEach((link) => expect(link).toHaveAttribute('href', '/student/lessons/lesson-2'))
  })

  it('enforces sequential unlocking across multiple lessons', async () => {
    // L1 = 100% (completed), L2 = 100% (completed), L3 = 55% (in_progress), L4 = not_started
    server.use(
      http.get(`${env.apiBaseUrl}/lessons/lesson-3`, () =>
        HttpResponse.json({
          id: 'lesson-3',
          title: 'الدرس الثالث',
          video: { id: 'v-3', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', durationSeconds: 100 },
          course: {
            id: 'c-1',
            title: 'دورة الفيزياء',
            currentSectionId: 's-1',
            sections: [
              {
                id: 's-1',
                title: 'الفصل الأول',
                sortOrder: 1,
                lessons: [
                  { id: 'lesson-1', title: 'الدرس الأول', sortOrder: 1, progressStatus: 'completed', watchedPercentage: 100 },
                  { id: 'lesson-2', title: 'الدرس الثاني', sortOrder: 2, progressStatus: 'completed', watchedPercentage: 100 },
                  { id: 'lesson-3', title: 'الدرس الثالث', sortOrder: 3, progressStatus: 'in_progress', watchedPercentage: 55 },
                  { id: 'lesson-4', title: 'الدرس الرابع', sortOrder: 4, progressStatus: 'not_started', watchedPercentage: 0 },
                ],
              },
            ],
          },
          progress: { lastPositionSeconds: 55, watchedPercentage: 55, status: 'in_progress' },
        }),
      ),
    )

    renderPage(['/student/lessons/lesson-3'], studentAuth)

    expect(await screen.findByRole('heading', { name: 'الدرس الثالث' })).toBeInTheDocument()

    // Lessons 1, 2, 3 should be unlocked (accessible)
    expect(screen.getByRole('link', { name: /الدرس الأول/ })).toHaveAttribute('href', '/student/lessons/lesson-1')
    expect(screen.getByRole('link', { name: /الدرس الثاني/ })).toHaveAttribute('href', '/student/lessons/lesson-2')
    expect(screen.getByRole('link', { current: 'page' })).toHaveTextContent('الدرس الثالث')

    // Lesson 4 should be locked (both playlist link and next lesson link)
    const l4Links = screen.getAllByRole('link', { name: /الدرس الرابع/ })
    expect(l4Links.length).toBeGreaterThanOrEqual(1)
    l4Links.forEach((link) => {
      expect(link).toHaveClass('locked')
      expect(link).toHaveAttribute('aria-disabled', 'true')
    })
  })
})
