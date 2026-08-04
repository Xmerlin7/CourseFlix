import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import { env } from '../../../shared/lib/env'
import { server } from '../../../testing/mocks/server'
import { renderWithProviders } from '../../../testing/renderWithProviders'
import { TeacherSalesPage } from './TeacherSalesPage'

describe('TeacherSalesPage', () => {
  it('renders revenue, order count, and best seller from the summary', async () => {
    server.use(
      http.get(`${env.apiBaseUrl}/teacher/sales/summary`, () =>
        HttpResponse.json({
          totalRevenue: 1250000,
          currency: 'EGP',
          successfulOrderCount: 4,
          bestSellingCourse: {
            courseId: 'course-1',
            courseTitle: 'الميكانيكا الكلاسيكية',
            orderCount: 2,
            totalRevenue: 900000,
          },
          dateRange: { from: '2026-01-01', to: '2026-12-31' },
        }),
      ),
    )

    renderWithProviders(<TeacherSalesPage />)

    expect(await screen.findAllByText(/EGP/)).toHaveLength(2)
    expect(screen.getByText('4')).toBeInTheDocument()
    expect(screen.getByText('الميكانيكا الكلاسيكية')).toBeInTheDocument()
  })

  it('shows an unavailable state when the endpoint is not ready', async () => {
    server.use(
      http.get(`${env.apiBaseUrl}/teacher/sales/summary`, () =>
        HttpResponse.json({ message: 'not ready' }, { status: 503 }),
      ),
    )

    renderWithProviders(<TeacherSalesPage />)

    expect(
      await screen.findByText('المبيعات غير متاحة حالياً'),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /إعادة المحاولة/ })).toBeInTheDocument()
  })
})
