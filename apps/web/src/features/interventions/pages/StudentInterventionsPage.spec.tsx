import { screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { env } from '../../../shared/lib/env'
import { server } from '../../../testing/mocks/server'
import { renderWithProviders } from '../../../testing/renderWithProviders'
import { StudentInterventionsPage } from './StudentInterventionsPage'

describe('StudentInterventionsPage', () => {
  it('renders an intervention with a pending mini quiz', async () => {
    server.use(
      http.get(`${env.apiBaseUrl}/student/interventions`, () =>
        HttpResponse.json([
          {
            id: 'intervention-1',
            courseId: 'course-1',
            ruleKey: 'low_quiz_score',
            weakConcept: 'قوانين نيوتن',
            status: 'active',
            miniQuizId: null,
            createdAt: '2026-08-04T10:00:00.000Z',
          },
        ]),
      ),
    )

    renderWithProviders(<StudentInterventionsPage />)

    expect(await screen.findByText('قوانين نيوتن')).toBeInTheDocument()
    expect(screen.getByText('جاري تجهيز اختبار قصير')).toBeInTheDocument()
  })

  it('shows a ready mini quiz chip when miniQuizId is set', async () => {
    server.use(
      http.get(`${env.apiBaseUrl}/student/interventions`, () =>
        HttpResponse.json([
          {
            id: 'intervention-1',
            courseId: 'course-1',
            ruleKey: 'low_quiz_score',
            weakConcept: 'قوانين نيوتن',
            status: 'active',
            miniQuizId: 'quiz-1',
            createdAt: '2026-08-04T10:00:00.000Z',
          },
        ]),
      ),
    )

    renderWithProviders(<StudentInterventionsPage />)

    expect(await screen.findByText('اختبار قصير جاهز')).toBeInTheDocument()
  })

  it('shows an empty state when there are no interventions', async () => {
    server.use(
      http.get(`${env.apiBaseUrl}/student/interventions`, () => HttpResponse.json([])),
    )

    renderWithProviders(<StudentInterventionsPage />)

    expect(await screen.findByText('لا توجد نقاط تحتاج مراجعة')).toBeInTheDocument()
  })
})
