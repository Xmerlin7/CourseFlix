import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { env } from '../../../shared/lib/env'
import { server } from '../../../testing/mocks/server'
import { renderWithProviders } from '../../../testing/renderWithProviders'
import type { CourseDetail } from '../../courses/types/course.types'
import { TeacherQuizManager } from './TeacherQuizManager'

const course: CourseDetail = {
  id: 'course-1',
  title: 'الميكانيكا الكلاسيكية',
  slug: 'mechanics',
  description: null,
  coverImageUrl: null,
  gradeLevel: null,
  priceMinor: null,
  status: 'published',
  teacher: {
    id: 'teacher-1',
    fullName: 'أ. سارة',
  },
  canEdit: true,
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
}

describe('TeacherQuizManager', () => {
  it('creates a manual quiz without AI', async () => {
    const user = userEvent.setup()
    let payload: unknown

    server.use(
      http.get(`${env.apiBaseUrl}/teacher/courses/course-1/quizzes`, () => HttpResponse.json([])),
      http.post(`${env.apiBaseUrl}/teacher/quizzes`, async ({ request }) => {
        payload = await request.json()
        return HttpResponse.json({
          id: 'quiz-1',
          title: 'اختبار نيوتن',
          version: 1,
          questions: [
            {
              id: 'question-1',
              type: 'mcq',
              text: 'ما هو نص القانون الأول؟',
              options: ['القصور الذاتي', 'القوة المحصلة'],
              correctAnswer: 'القصور الذاتي',
            },
          ],
        })
      }),
    )

    renderWithProviders(<TeacherQuizManager course={course} />)

    await user.click(await screen.findByRole('button', { name: /اختبار جديد/ }))
    await user.type(screen.getByLabelText('عنوان الاختبار'), 'اختبار نيوتن')
    await user.selectOptions(screen.getByLabelText('مكان الاختبار'), 'lesson')
    await user.selectOptions(screen.getByLabelText('الدرس'), 'lesson-1')
    await user.type(screen.getByLabelText('نص السؤال'), 'ما هو نص القانون الأول؟')
    await user.type(screen.getByLabelText('إجابة 1'), 'القصور الذاتي')
    await user.type(screen.getByLabelText('إجابة 2'), 'القوة المحصلة')
    await user.selectOptions(screen.getByLabelText('الإجابة الصحيحة'), 'القصور الذاتي')
    await user.click(screen.getByRole('button', { name: /حفظ الاختبار/ }))

    await waitFor(() => {
      expect(payload).toEqual({
        courseId: 'course-1',
        sectionId: 'section-1',
        lessonId: 'lesson-1',
        title: 'اختبار نيوتن',
        questions: [
          {
            type: 'mcq',
            text: 'ما هو نص القانون الأول؟',
            options: ['القصور الذاتي', 'القوة المحصلة'],
            correctAnswer: 'القصور الذاتي',
          },
        ],
      })
    })
  }, 15000)

  it('edits an existing manual quiz', async () => {
    const user = userEvent.setup()
    let payload: unknown

    server.use(
      http.get(`${env.apiBaseUrl}/teacher/courses/course-1/quizzes`, () =>
        HttpResponse.json([
          {
            id: 'quiz-1',
            title: 'اختبار قديم',
            version: 1,
            questions: [
              {
                id: 'question-1',
                type: 'true_false',
                text: 'الجسم يحافظ على حالته ما لم تؤثر قوة.',
                options: ['صح', 'خطأ'],
                correctAnswer: 'صح',
              },
            ],
          },
        ]),
      ),
      http.patch(`${env.apiBaseUrl}/teacher/quizzes/quiz-1`, async ({ request }) => {
        payload = await request.json()
        return HttpResponse.json({
          id: 'quiz-1',
          title: 'اختبار معدل',
          version: 2,
          questions: [],
        })
      }),
    )

    renderWithProviders(<TeacherQuizManager course={course} />)

    await user.click(await screen.findByRole('button', { name: /تعديل/ }))
    const titleInput = screen.getByDisplayValue('اختبار قديم')
    await user.clear(titleInput)
    await user.type(titleInput, 'اختبار معدل')
    await user.click(screen.getByRole('button', { name: /حفظ الاختبار/ }))

    await waitFor(() => {
      expect(payload).toEqual({
        title: 'اختبار معدل',
        questions: [
          {
            id: 'question-1',
            type: 'true_false',
            text: 'الجسم يحافظ على حالته ما لم تؤثر قوة.',
            options: ['صح', 'خطأ'],
            correctAnswer: 'صح',
          },
        ],
      })
    })
  }, 15000)
})
