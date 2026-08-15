import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'
import { env } from '../../../shared/lib/env'
import { server } from '../../../testing/mocks/server'
import { renderWithProviders } from '../../../testing/renderWithProviders'
import { TeacherAuthPosterSettingsForm } from './TeacherAuthPosterSettingsForm'

const teacherAuth = {
  user: {
    id: 'teacher-1',
    email: 'teacher@example.com',
    fullName: 'محمد عبدالرحمن',
    role: 'teacher' as const,
    avatarUrl: null,
  },
  isLoading: false,
  login: vi.fn(),
  logout: vi.fn(),
  register: vi.fn(),
  verifyOtp: vi.fn(),
  updateUser: vi.fn(),
}

function posterResponse(featuredCourseId = 'course-1') {
  return {
    featuredCourseId,
    isFallback: false,
    course: {
      id: featuredCourseId,
      title: featuredCourseId === 'course-2' ? 'الميكانيكا' : 'الفيزياء الحديثة',
      description: 'شرح منظم ومراجعات ذكية.',
      coverImageUrl: null,
      gradeLevel: 'الثالث الثانوي',
      teacherName: 'محمد عبدالرحمن',
    },
  }
}

describe('TeacherAuthPosterSettingsForm', () => {
  it('lets the teacher preview and save one of their published courses', async () => {
    let savedCourseId: string | null | undefined
    let savedStudyPlanValue: string | undefined
    server.use(
      http.get(`${env.apiBaseUrl}/teacher/auth-poster`, () =>
        HttpResponse.json(posterResponse()),
      ),
      http.get(`${env.apiBaseUrl}/teacher/courses`, () =>
        HttpResponse.json([
          {
            id: 'course-1',
            title: 'الفيزياء الحديثة',
            description: 'شرح منظم ومراجعات ذكية.',
            coverImageUrl: null,
            gradeLevel: 'الثالث الثانوي',
            status: 'published',
          },
          {
            id: 'course-2',
            title: 'الميكانيكا',
            description: 'رحلة واضحة لفهم الميكانيكا.',
            coverImageUrl: null,
            gradeLevel: 'الثاني الثانوي',
            status: 'published',
          },
        ]),
      ),
      http.patch(`${env.apiBaseUrl}/teacher/auth-poster`, async ({ request }) => {
        const body = (await request.json()) as {
          featuredCourseId?: string | null
          customization?: { studyPlanValue?: string }
        }
        savedCourseId = body.featuredCourseId
        savedStudyPlanValue = body.customization?.studyPlanValue
        return HttpResponse.json(posterResponse(body.featuredCourseId ?? 'course-1'))
      }),
    )

    const user = userEvent.setup()
    renderWithProviders(<TeacherAuthPosterSettingsForm />, { auth: teacherAuth })

    const select = await screen.findByLabelText('الدورة المميزة')
    await waitFor(() => expect(select).not.toBeDisabled())
    const studyPlanValue = screen.getByLabelText('قيمة خطة المذاكرة')
    await user.clear(studyPlanValue)
    await user.type(studyPlanValue, '2 weeks')
    await user.selectOptions(select, 'course-2')

    expect(screen.getAllByText('الميكانيكا').length).toBeGreaterThan(0)
    expect(screen.getByText('2 weeks')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /حفظ واجهة الدخول/ }))

    await waitFor(() => expect(savedCourseId).toBe('course-2'))
    expect(savedStudyPlanValue).toBe('2 weeks')
  })
})
