import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import { env } from '../../../shared/lib/env'
import { server } from '../../../testing/mocks/server'
import { renderWithProviders } from '../../../testing/renderWithProviders'
import { TeacherAnalyticsPage } from './TeacherAnalyticsPage'

describe('TeacherAnalyticsPage', () => {
  it('answers a revenue question', async () => {
    server.use(
      http.post(`${env.apiBaseUrl}/teacher/analytics/questions`, () =>
        HttpResponse.json({
          status: 'success',
          intent: 'revenue',
          result: {
            totalRevenue: 50000,
            currency: 'EGP',
            orderCount: 2,
            dateRange: { from: '2026-01-01', to: '2026-01-31' },
          },
        }),
      ),
    )

    const user = userEvent.setup()
    renderWithProviders(<TeacherAnalyticsPage />)

    await user.type(
      await screen.findByPlaceholderText('اكتب سؤالك هنا...'),
      'كم إيراداتي هذا الشهر؟',
    )
    await user.click(screen.getByRole('button', { name: /إرسال/ }))

    expect(await screen.findByText('إجمالي الإيرادات')).toBeInTheDocument()
    expect(screen.getByText(/EGP/)).toBeInTheDocument()
  })

  it('shows supported examples for an unsupported question', async () => {
    server.use(
      http.post(`${env.apiBaseUrl}/teacher/analytics/questions`, () =>
        HttpResponse.json({
          status: 'unsupported',
          message: 'هذا السؤال غير مدعوم. الأسئلة المدعومة:',
          supportedIntents: [
            { intent: 'revenue', description: 'إجمالي الإيرادات خلال فترة محددة' },
          ],
          examples: ['كم إيراداتي من 1 يناير إلى 31 مارس؟'],
        }),
      ),
    )

    const user = userEvent.setup()
    renderWithProviders(<TeacherAnalyticsPage />)

    await user.type(
      await screen.findByPlaceholderText('اكتب سؤالك هنا...'),
      'ما هو الطقس اليوم؟',
    )
    await user.click(screen.getByRole('button', { name: /إرسال/ }))

    await waitFor(() => {
      expect(screen.getByText('هذا السؤال غير مدعوم. الأسئلة المدعومة:')).toBeInTheDocument()
    })
    expect(screen.getAllByText('كم إيراداتي من 1 يناير إلى 31 مارس؟')).toHaveLength(2)
  })
})
