import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { http, HttpResponse } from 'msw'
import { env } from '../../../shared/lib/env'
import { server } from '../../../testing/mocks/server'
import { renderWithProviders } from '../../../testing/renderWithProviders'
import { TeacherSalesPage } from './TeacherSalesPage'

describe('TeacherSalesPage', () => {
  it('renders revenue, order count, stat tiles, sales table, and best seller', async () => {
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

    // Expect stat tiles and table rows
    expect(await screen.findByText('المبيعات')).toBeInTheDocument()
    expect(screen.getAllByText('إجمالي الإيرادات').length).toBeGreaterThan(0)
    expect(screen.getByText('الطلبات الناجحة')).toBeInTheDocument()
    expect(screen.getByText('إجمالي الطلبات')).toBeInTheDocument()
    expect(screen.getByText('متوسط قيمة الطلب')).toBeInTheDocument()
    expect(screen.getByText('الميكانيكا الكلاسيكية')).toBeInTheDocument()
    expect(screen.getByText('تفاصيل مبيعات الدورات')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /تصدير/ })).toBeEnabled()
  })

  it('applies quick date presets and re-queries API', async () => {
    let queriedFrom: string | null = null
    let queriedTo: string | null = null

    server.use(
      http.get(`${env.apiBaseUrl}/teacher/sales/summary`, ({ request }) => {
        const url = new URL(request.url)
        queriedFrom = url.searchParams.get('from')
        queriedTo = url.searchParams.get('to')
        return HttpResponse.json({
          totalRevenue: 50000,
          currency: 'EGP',
          successfulOrderCount: 1,
          bestSellingCourse: null,
          dateRange: { from: queriedFrom, to: queriedTo },
        })
      }),
    )

    const user = userEvent.setup()
    renderWithProviders(<TeacherSalesPage />)

    await user.click(await screen.findByRole('button', { name: 'اليوم' }))
    await user.click(screen.getByRole('button', { name: 'بحث بالفلاتر' }))

    await waitFor(() => {
      expect(queriedFrom).not.toBeNull()
      expect(queriedTo).not.toBeNull()
    })
  })

  it('renders an empty state when there are no sales in period', async () => {
    server.use(
      http.get(`${env.apiBaseUrl}/teacher/sales/summary`, () =>
        HttpResponse.json({
          totalRevenue: 0,
          currency: 'EGP',
          successfulOrderCount: 0,
          bestSellingCourse: null,
          dateRange: { from: null, to: null },
        }),
      ),
    )

    renderWithProviders(<TeacherSalesPage />)

    expect(await screen.findByText('لا توجد مبيعات خلال الفترة المحددة')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /تصدير/ })).toBeDisabled()
  })

  it('shows an unavailable state when the endpoint fails', async () => {
    server.use(
      http.get(`${env.apiBaseUrl}/teacher/sales/summary`, () =>
        HttpResponse.json({ message: 'not ready' }, { status: 503 }),
      ),
    )

    renderWithProviders(<TeacherSalesPage />)

    expect(await screen.findByText('المبيعات غير متاحة حالياً')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /إعادة المحاولة/ })).toBeInTheDocument()
  })
})
