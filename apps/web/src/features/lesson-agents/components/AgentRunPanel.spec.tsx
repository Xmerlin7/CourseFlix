import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'
import { env } from '../../../shared/lib/env'
import { server } from '../../../testing/mocks/server'
import { renderWithProviders } from '../../../testing/renderWithProviders'
import type { LessonAgentRunDetail, LessonAgentStep } from '../types/lesson-agents.types'
import { AgentRunPanel } from './AgentRunPanel'

function step(overrides: Partial<LessonAgentStep> = {}): LessonAgentStep {
  return {
    id: 'step-transcript',
    agentKey: 'transcript',
    name: 'المُفرِّغ',
    role: 'يستخرج نص الفيديو',
    icon: 'graphic_eq',
    mandatory: true,
    reviewable: false,
    creditCost: 1,
    orderIndex: 0,
    status: 'completed',
    reviewStatus: 'not_required',
    progress: 100,
    headline: 'فرّغت ٤١٢ جملة',
    output: null,
    errorMessage: null,
    attempt: 1,
    startedAt: null,
    finishedAt: null,
    feedback: [],
    ...overrides,
  }
}

function run(overrides: Partial<LessonAgentRunDetail> = {}): LessonAgentRunDetail {
  return {
    id: 'run-1',
    lessonId: 'lesson-1',
    courseId: 'course-1',
    lessonTitle: 'قانون نيوتن الأول',
    status: 'pending_review',
    progress: 100,
    creditsCharged: 14,
    errorMessage: null,
    createdAt: '2026-08-19T00:00:00.000Z',
    startedAt: '2026-08-19T00:00:01.000Z',
    finishedAt: null,
    canPublish: false,
    config: {
      enabledAgents: ['transcript', 'reviewer', 'indexer', 'handout', 'quizmaster'],
      handout: {
        pageCount: 4,
        tone: 'simple',
        includeExamples: true,
        includeKeyTerms: true,
        includeSummary: true,
      },
      quiz: { difficulty: 'medium', questionCount: 8, types: ['mcq'], dueInDays: 7 },
    },
    steps: [
      step(),
      step({
        id: 'step-handout',
        agentKey: 'handout',
        name: 'كاتب الشرح',
        role: 'يكتب مذكّرة شرح',
        icon: 'menu_book',
        mandatory: false,
        reviewable: true,
        orderIndex: 3,
        reviewStatus: 'pending',
        headline: 'كتبت مذكّرة في ٤ صفحات',
        output: { fileName: 'قانون نيوتن الأول.pdf', pageTitles: ['المحور الأول'] },
      }),
    ],
    events: [
      {
        id: 'event-1',
        type: 'handoff',
        agentKey: 'transcript',
        toAgentKey: 'indexer',
        message: 'المُفرِّغ سلّم الشغل لـالمُفهرِس.',
        metadata: null,
        createdAt: '2026-08-19T00:00:05.000Z',
      },
    ],
    ...overrides,
  }
}

function stubRun(detail: LessonAgentRunDetail) {
  server.use(
    http.get(`${env.apiBaseUrl}/teacher/agent-runs/run-1`, () => HttpResponse.json(detail)),
  )
}

describe('AgentRunPanel', () => {
  it('shows the whole crew, including agents that have not started', async () => {
    stubRun(run())
    renderWithProviders(<AgentRunPanel runId="run-1" onClose={vi.fn()} />)

    expect(await screen.findByText('المُفرِّغ')).toBeInTheDocument()
    expect(screen.getAllByText('كاتب الشرح').length).toBeGreaterThan(0)
  })

  it('renders the handoff line so the teacher sees who passed work to whom', async () => {
    stubRun(run())
    renderWithProviders(<AgentRunPanel runId="run-1" onClose={vi.fn()} />)

    expect(await screen.findByText('المُفرِّغ سلّم الشغل لـالمُفهرِس.')).toBeInTheDocument()
  })

  it('offers approve/reject/comment only for the reviewable agent', async () => {
    stubRun(run())
    renderWithProviders(<AgentRunPanel runId="run-1" onClose={vi.fn()} />)

    expect(await screen.findByRole('button', { name: /وافق/ })).toBeInTheDocument()
    // One review card, for the handout — the transcriber is never reviewed.
    expect(screen.getAllByRole('button', { name: /وافق/ })).toHaveLength(1)
  })

  it('sends a comment to the step feedback endpoint, re-running just that agent', async () => {
    const user = userEvent.setup()
    let body: unknown

    stubRun(run())
    server.use(
      http.post(
        `${env.apiBaseUrl}/teacher/agent-runs/run-1/steps/step-handout/feedback`,
        async ({ request }) => {
          body = await request.json()
          return HttpResponse.json(run({ status: 'running' }))
        },
      ),
    )

    renderWithProviders(<AgentRunPanel runId="run-1" onClose={vi.fn()} />)

    const textarea = await screen.findByLabelText(/اكتب ملاحظة/)
    await user.type(textarea, 'الشرح مختصر أوي')
    await user.click(screen.getByRole('button', { name: /اعمله تاني بالملاحظة دي/ }))

    await waitFor(() => expect(body).toEqual({ message: 'الشرح مختصر أوي' }))
  })

  it('blocks publishing while an agent is still waiting on a verdict', async () => {
    stubRun(run({ canPublish: false }))
    renderWithProviders(<AgentRunPanel runId="run-1" onClose={vi.fn()} />)

    expect(await screen.findByRole('button', { name: /انشر شغل الفريق/ })).toBeDisabled()
    expect(screen.getByText('لسه في وكيل مستني رأيك قبل ما تنشر.')).toBeInTheDocument()
  })

  it('enables publishing once every agent has a verdict', async () => {
    stubRun(
      run({
        canPublish: true,
        steps: [step(), step({ id: 'step-handout', agentKey: 'handout', reviewable: true, reviewStatus: 'approved', name: 'كاتب الشرح' })],
      }),
    )
    renderWithProviders(<AgentRunPanel runId="run-1" onClose={vi.fn()} />)

    expect(await screen.findByRole('button', { name: /انشر شغل الفريق/ })).toBeEnabled()
  })

  it('surfaces a failed agent’s reason instead of a bare error state', async () => {
    stubRun(
      run({
        steps: [
          step({
            id: 'step-handout',
            agentKey: 'handout',
            name: 'كاتب الشرح',
            reviewable: true,
            status: 'failed',
            errorMessage: 'النموذج رجّع شرحًا مش صالح للطباعة',
          }),
        ],
      }),
    )
    renderWithProviders(<AgentRunPanel runId="run-1" onClose={vi.fn()} />)

    expect(
      await screen.findByText(/النموذج رجّع شرحًا مش صالح للطباعة/),
    ).toBeInTheDocument()
  })
})
