import { Route, Routes } from 'react-router'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import { env } from '../../../shared/lib/env'
import { server } from '../../../testing/mocks/server'
import { renderWithProviders } from '../../../testing/renderWithProviders'
import { StudentMiniQuizPage } from './StudentMiniQuizPage'

function renderPage() {
  return renderWithProviders(
    <Routes>
      <Route path="/student/mini-quizzes/:miniQuizId" element={<StudentMiniQuizPage />} />
    </Routes>,
    { initialEntries: ['/student/mini-quizzes/quiz-1'] },
  )
}

const quizPayload = {
  id: 'quiz-1',
  weakConcept: 'قوانين نيوتن',
  status: 'active',
  score: null,
  total: null,
  questions: [
    {
      id: 'q1',
      type: 'mcq',
      text: 'ما هو القانون الأساسي المتعلق بهذه المفاهيم؟',
      options: ['قانون أول', 'قانون ثاني'],
    },
  ],
}

describe('StudentMiniQuizPage', () => {
  it('renders the mini quiz questions', async () => {
    server.use(
      http.get(`${env.apiBaseUrl}/student/mini-quizzes/quiz-1`, () =>
        HttpResponse.json(quizPayload),
      ),
    )

    renderPage()

    expect(
      await screen.findByText(/ما هو القانون الأساسي المتعلق بهذه المفاهيم/),
    ).toBeInTheDocument()
    expect(screen.getByText('قانون أول')).toBeInTheDocument()
  })

  it('submits answers and shows the server-graded score', async () => {
    server.use(
      http.get(`${env.apiBaseUrl}/student/mini-quizzes/quiz-1`, () =>
        HttpResponse.json(quizPayload),
      ),
    )
    server.use(
      http.post(`${env.apiBaseUrl}/student/mini-quizzes/quiz-1/submit`, () =>
        HttpResponse.json({
          score: 1,
          total: 1,
          answers: [{ questionId: 'q1', isCorrect: true }],
        }),
      ),
    )

    const user = userEvent.setup()
    renderPage()

    await user.click(await screen.findByText('قانون أول'))
    await user.click(screen.getByRole('button', { name: /إرسال الإجابات/ }))

    expect(await screen.findByText('1 من 1')).toBeInTheDocument()
    expect(screen.getByText(/أحسنت/)).toBeInTheDocument()
  })

  it('shows a not-found state for a missing quiz', async () => {
    server.use(
      http.get(`${env.apiBaseUrl}/student/mini-quizzes/quiz-1`, () =>
        HttpResponse.json({ message: 'not found' }, { status: 404 }),
      ),
    )

    renderPage()

    await waitFor(() => {
      expect(screen.getByText(/غير موجود/)).toBeInTheDocument()
    })
  })
})
