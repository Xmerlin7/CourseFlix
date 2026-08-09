import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import { env } from '../../shared/lib/env'
import { server } from '../../testing/mocks/server'
import { renderWithProviders } from '../../testing/renderWithProviders'
import { FloatingAssistant } from './FloatingAssistant'

describe('FloatingAssistant', () => {
  it('lets a student ask the current course tutor from a floating panel', async () => {
    const user = userEvent.setup()

    renderWithProviders(<FloatingAssistant role="student" />, {
      initialEntries: ['/student/courses/course-1'],
    })

    await user.click(screen.getByRole('button', { name: 'افتح مساعد الدورة' }))
    await waitFor(() => {
      expect(screen.getByLabelText('سؤالك للمساعد')).not.toBeDisabled()
    })

    await user.type(screen.getByLabelText('سؤالك للمساعد'), 'اشرح قانون نيوتن الثالث')
    await user.click(screen.getByRole('button', { name: 'إرسال السؤال' }))

    expect(await screen.findByText(/حسب المادة المرفوعة/)).toBeInTheDocument()
    expect(screen.getByText('physics.pdf')).toBeInTheDocument()
  })

  it('lets a teacher ask analytics from a floating panel', async () => {
    server.use(
      http.post(`${env.apiBaseUrl}/teacher/analytics/questions`, () =>
        HttpResponse.json({
          status: 'success',
          intent: 'student_count',
          result: {
            activeStudentCount: 12,
            enrollmentCount: 14,
            dateRange: { from: null, to: null },
          },
        }),
      ),
    )

    const user = userEvent.setup()

    renderWithProviders(<FloatingAssistant role="teacher" />, {
      initialEntries: ['/teacher/dashboard'],
    })

    await user.click(screen.getByRole('button', { name: 'افتح مساعد التحليلات' }))
    await user.type(screen.getByLabelText('سؤالك لمساعد التحليلات'), 'عندي كام طالب؟')
    await user.click(screen.getByRole('button', { name: 'إرسال السؤال' }))

    expect(await screen.findByText(/الطلاب النشطون: 12/)).toBeInTheDocument()
    expect(screen.getByText(/التسجيلات النشطة: 14/)).toBeInTheDocument()
  })

  it('sends question on Enter in student floating panel', async () => {
    const user = userEvent.setup()

    renderWithProviders(<FloatingAssistant role="student" />, {
      initialEntries: ['/student/courses/course-1'],
    })

    await user.click(screen.getByRole('button', { name: 'افتح مساعد الدورة' }))
    const input = await screen.findByLabelText('سؤالك للمساعد')
    await user.type(input, 'اشرح قانون نيوتن الثالث{Enter}')

    expect(await screen.findByText(/حسب المادة المرفوعة/)).toBeInTheDocument()
  })

  it('sends question on Enter in teacher floating panel', async () => {
    server.use(
      http.post(`${env.apiBaseUrl}/teacher/analytics/questions`, () =>
        HttpResponse.json({
          status: 'success',
          intent: 'student_count',
          result: {
            activeStudentCount: 12,
            enrollmentCount: 14,
            dateRange: { from: null, to: null },
          },
        }),
      ),
    )

    const user = userEvent.setup()

    renderWithProviders(<FloatingAssistant role="teacher" />, {
      initialEntries: ['/teacher/dashboard'],
    })

    await user.click(screen.getByRole('button', { name: 'افتح مساعد التحليلات' }))
    const input = await screen.findByLabelText('سؤالك لمساعد التحليلات')
    await user.type(input, 'عندي كام طالب؟{Enter}')

    expect(await screen.findByText(/الطلاب النشطون: 12/)).toBeInTheDocument()
  })
})
