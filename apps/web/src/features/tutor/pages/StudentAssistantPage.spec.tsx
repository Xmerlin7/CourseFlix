import { Route, Routes } from 'react-router'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import { env } from '../../../shared/lib/env'
import { server } from '../../../testing/mocks/server'
import { renderWithProviders } from '../../../testing/renderWithProviders'
import { StudentAssistantPage } from './StudentAssistantPage'

function renderPage() {
  return renderWithProviders(
    <Routes>
      <Route
        path="/student/courses/:courseId/assistant"
        element={<StudentAssistantPage />}
      />
    </Routes>,
    { initialEntries: ['/student/courses/course-1/assistant'] },
  )
}

describe('StudentAssistantPage', () => {
  it('sends a message and renders citations for an answered response', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.type(screen.getByLabelText('سؤالك'), 'اشرح قانون نيوتن الثالث')
    await user.click(screen.getByRole('button', { name: /إرسال السؤال/ }))

    expect(await screen.findByText(/حسب المادة المرفوعة/)).toBeInTheDocument()
    expect(screen.getByText('physics.pdf')).toBeInTheDocument()
    expect(screen.getByText(/صفحة 2/)).toBeInTheDocument()
  })

  it('renders no citations for the no-answer state', async () => {
    server.use(
      http.post(`${env.apiBaseUrl}/courses/:courseId/tutor/messages`, () =>
        HttpResponse.json({
          messageId: 'no-answer-1',
          status: 'no_answer',
          answer: 'المواد المرفوعة لا تغطي هذا السؤال بعد.',
          citations: [],
        }),
      ),
    )

    const user = userEvent.setup()
    renderPage()

    await user.type(screen.getByLabelText('سؤالك'), 'سؤال خارج المحتوى')
    await user.click(screen.getByRole('button', { name: /إرسال السؤال/ }))

    expect(await screen.findByText('المواد المرفوعة لا تغطي هذا السؤال بعد.')).toBeInTheDocument()
    expect(screen.getByText('بدون مصادر')).toBeInTheDocument()
    expect(screen.queryByText(/صفحة/)).not.toBeInTheDocument()
  })

  it('shows retry when the API fails', async () => {
    server.use(
      http.post(`${env.apiBaseUrl}/courses/:courseId/tutor/messages`, () =>
        HttpResponse.json({ message: 'unavailable' }, { status: 503 }),
      ),
    )

    const user = userEvent.setup()
    renderPage()

    await user.type(screen.getByLabelText('سؤالك'), 'اشرح القانون')
    await user.click(screen.getByRole('button', { name: /إرسال السؤال/ }))

    await waitFor(() => {
      expect(screen.getByText('تعذر إرسال السؤال')).toBeInTheDocument()
    })
    expect(screen.getByRole('button', { name: /إعادة المحاولة/ })).toBeInTheDocument()
  })
})
