import { screen, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'
import { AuthLayout } from '../../../app/layouts/AuthLayout'
import { renderWithProviders } from '../../../testing/renderWithProviders'
import { server } from '../../../testing/mocks/server'
import { env } from '../../../shared/lib/env'
import { TeacherPoster } from './TeacherPoster'

const apiUrl = (path: string) => `${env.apiBaseUrl}${path}`
const auth = {
  user: null,
  isLoading: false,
  login: vi.fn(),
  logout: vi.fn(),
  register: vi.fn(),
  updateUser: vi.fn(),
  verifyOtp: vi.fn(),
}

describe('TeacherPoster', () => {
  it('renders selected course data', () => {
    renderWithProviders(
      <TeacherPoster
        content={{
          featuredCourseId: 'course-1',
          isFallback: false,
          course: {
            id: 'course-1',
            title: 'رياضيات الثانوية العامة',
            description: 'خطة مذاكرة واضحة للطلاب.',
            coverImageUrl: null,
            gradeLevel: 'الثالث الثانوي',
            teacherName: 'أحمد علي',
          },
        }}
      />,
      { auth },
    )

    expect(screen.getByText('رياضيات الثانوية العامة')).toBeInTheDocument()
    expect(screen.getByText('أحمد علي')).toBeInTheDocument()
    expect(screen.getByText('الثالث الثانوي')).toBeInTheDocument()
  })

  it('renders customized card text', () => {
    renderWithProviders(
      <TeacherPoster
        content={{
          featuredCourseId: 'course-1',
          isFallback: false,
          customization: {
            badgeText: 'تعلم بطريقتك',
            teacherPrefix: 'بإشراف',
            studyPlanValue: '2 weeks',
            studyPlanLabel: 'مدة الخطة',
            quizValue: '10 quizzes',
            quizLabel: 'تدريب عملي',
            followUpValue: 'يوميًا',
            followUpLabel: 'متابعة مستمرة',
            journeyLabel: 'تقدمك',
          },
          course: {
            id: 'course-1',
            title: 'الفيزياء',
            description: 'شرح مبسط.',
            coverImageUrl: null,
            gradeLevel: 'الثالث الثانوي',
            teacherName: 'محمد عبدالرحمن',
          },
        }}
      />,
      { auth },
    )

    expect(screen.getByText('2 weeks')).toBeInTheDocument()
    expect(screen.getByText('مدة الخطة')).toBeInTheDocument()
    expect(screen.getByText('تعلم بطريقتك')).toBeInTheDocument()
  })

  it('renders fallback auth poster content when public config fails', async () => {
    server.use(
      http.get(apiUrl('/public/auth-poster'), () =>
        HttpResponse.json({ message: 'Nope' }, { status: 500 }),
      ),
    )

    renderWithProviders(
      <AuthLayout>
        <p>نموذج الدخول</p>
      </AuthLayout>,
      { auth },
    )

    expect(screen.getByText('نموذج الدخول')).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.getAllByText('الفيزياء').length).toBeGreaterThan(0)
    })
  })
})
