import { screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { env } from '../../../shared/lib/env'
import { server } from '../../../testing/mocks/server'
import { renderWithProviders } from '../../../testing/renderWithProviders'
import { TeacherInterventionsPage } from './TeacherInterventionsPage'

describe('TeacherInterventionsPage', () => {
  it('renders a report with the student name and rule label', async () => {
    server.use(
      http.get(`${env.apiBaseUrl}/teacher/interventions`, () =>
        HttpResponse.json([
          {
            id: 'intervention-1',
            studentId: 'student-1',
            studentName: 'أحمد محمود',
            courseId: 'course-1',
            ruleKey: 'explicit_confusion_phrase',
            ruleVersion: 1,
            weakConcept: 'الفيزياء',
            status: 'active',
            miniQuizId: null,
            createdAt: '2026-08-04T10:00:00.000Z',
          },
        ]),
      ),
    )

    renderWithProviders(<TeacherInterventionsPage />)

    expect(await screen.findByText('أحمد محمود')).toBeInTheDocument()
    expect(screen.getByText(/صعوبة في الفهم/)).toBeInTheDocument()
    expect(screen.getByText('نشط')).toBeInTheDocument()
  })

  it('shows an empty state when there are no reports', async () => {
    server.use(
      http.get(`${env.apiBaseUrl}/teacher/interventions`, () => HttpResponse.json([])),
    )

    renderWithProviders(<TeacherInterventionsPage />)

    expect(await screen.findByText('لا توجد تقارير متابعة')).toBeInTheDocument()
  })

  it('shows the forbidden state on a 403', async () => {
    server.use(
      http.get(`${env.apiBaseUrl}/teacher/interventions`, () =>
        HttpResponse.json({ message: 'Teachers only.' }, { status: 403 }),
      ),
    )

    renderWithProviders(<TeacherInterventionsPage />)

    expect(await screen.findByText('غير مسموح لك بالوصول')).toBeInTheDocument()
  })
})
