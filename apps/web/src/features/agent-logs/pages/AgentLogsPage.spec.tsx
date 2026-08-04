import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { env } from '../../../shared/lib/env'
import { server } from '../../../testing/mocks/server'
import { renderWithProviders } from '../../../testing/renderWithProviders'
import { AgentLogsPage } from './AgentLogsPage'

const LOGS = [
  {
    id: 'log-1',
    agentType: 'proactive_proctor' as const,
    courseId: 'course-1',
    targetEntityType: 'intervention',
    targetEntityId: 'intervention-1',
    action: 'intervention.created',
    status: 'success' as const,
    tokensUsed: null,
    durationMs: 12,
    rowCount: null,
    correlationId: 'corr-1',
    metadata: { ruleKey: 'low_quiz_score' },
    errorMessage: null,
    executedAt: '2026-08-04T10:00:00.000Z',
  },
  {
    id: 'log-2',
    agentType: 'analytics_agent' as const,
    courseId: 'course-1',
    targetEntityType: null,
    targetEntityId: null,
    action: 'analytics.question.unsupported',
    status: 'skipped' as const,
    tokensUsed: null,
    durationMs: 3,
    rowCount: 0,
    correlationId: 'corr-2',
    metadata: null,
    errorMessage: null,
    executedAt: '2026-08-04T10:05:00.000Z',
  },
]

describe('AgentLogsPage', () => {
  it('renders both success and skipped entries', async () => {
    server.use(
      http.get(`${env.apiBaseUrl}/teacher/agent-logs`, () => HttpResponse.json(LOGS)),
    )

    renderWithProviders(<AgentLogsPage />)

    expect(await screen.findByText('intervention.created')).toBeInTheDocument()
    expect(screen.getByText('analytics.question.unsupported')).toBeInTheDocument()
  })

  it('expands a row to show correlation ID and metadata detail', async () => {
    server.use(
      http.get(`${env.apiBaseUrl}/teacher/agent-logs`, () => HttpResponse.json(LOGS)),
    )

    const user = userEvent.setup()
    renderWithProviders(<AgentLogsPage />)

    await user.click(await screen.findByText('intervention.created'))

    expect(screen.getByText(/corr-1/)).toBeInTheDocument()
  })

  it('re-requests with the selected status filter', async () => {
    let lastStatus: string | null = null
    server.use(
      http.get(`${env.apiBaseUrl}/teacher/agent-logs`, ({ request }) => {
        lastStatus = new URL(request.url).searchParams.get('status')
        return HttpResponse.json(LOGS)
      }),
    )

    const user = userEvent.setup()
    renderWithProviders(<AgentLogsPage />)

    await screen.findByText('intervention.created')
    await user.click(screen.getByRole('button', { name: 'نجاح' }))

    await waitFor(() => {
      expect(lastStatus).toBe('success')
    })
  })

  it('shows an empty state when there is no activity', async () => {
    server.use(http.get(`${env.apiBaseUrl}/teacher/agent-logs`, () => HttpResponse.json([])))

    renderWithProviders(<AgentLogsPage />)

    expect(await screen.findByText('لا يوجد نشاط مسجل')).toBeInTheDocument()
  })

  it('shows the forbidden state on a 403', async () => {
    server.use(
      http.get(`${env.apiBaseUrl}/teacher/agent-logs`, () =>
        HttpResponse.json({ message: 'Teachers only.' }, { status: 403 }),
      ),
    )

    renderWithProviders(<AgentLogsPage />)

    await waitFor(() => {
      expect(screen.getByText('غير مسموح لك بالوصول')).toBeInTheDocument()
    })
  })
})
