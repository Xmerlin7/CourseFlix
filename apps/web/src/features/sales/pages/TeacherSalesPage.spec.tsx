import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi, afterEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { env } from '../../../shared/lib/env'
import { server } from '../../../testing/mocks/server'
import { renderWithProviders } from '../../../testing/renderWithProviders'
import { TeacherSalesPage } from './TeacherSalesPage'

// Mirrors the ISO-date math in TeacherSalesPage's formatDateIso/applyPreset —
// computed at test-run time so assertions don't drift or go flaky across
// month boundaries.
function isoDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function addDays(date: Date, days: number): Date {
  const copy = new Date(date)
  copy.setDate(copy.getDate() + days)
  return copy
}

const summaryUrl = `${env.apiBaseUrl}/teacher/sales/summary`

describe('TeacherSalesPage', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders revenue, order count, stat tiles, sales table, and best seller mapped from the real backend shape', async () => {
    server.use(
      http.get(summaryUrl, () =>
        HttpResponse.json({
          from: null,
          to: null,
          currency: 'EGP',
          timezone: 'Africa/Cairo',
          revenueMinor: 1250000,
          ordersCount: 4,
          bestSeller: {
            courseId: 'course-1',
            title: 'الميكانيكا الكلاسيكية',
            ordersCount: 2,
            revenueMinor: 900000,
          },
        }),
      ),
    )

    renderWithProviders(<TeacherSalesPage />)

    expect(await screen.findByText('المبيعات')).toBeInTheDocument()
    expect(screen.getAllByText('إجمالي الإيرادات').length).toBeGreaterThan(0)
    expect(screen.getByText('الطلبات الناجحة')).toBeInTheDocument()
    expect(screen.getByText('إجمالي الطلبات')).toBeInTheDocument()
    expect(screen.getByText('متوسط قيمة الطلب')).toBeInTheDocument()
    expect(screen.getByText('الميكانيكا الكلاسيكية')).toBeInTheDocument()
    expect(screen.getByText('تفاصيل مبيعات الدورات')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /تصدير/ })).toBeEnabled()

    // 1,250,000 minor units -> 12,500 EGP, shown in both the stat tile and
    // the table's totals row; avg order value = 1250000/4/100 = 3,125 EGP,
    // likewise shown in both places. ('ar-EG'.toLocaleString renders
    // Eastern Arabic-Indic digits/separator.)
    expect(screen.getAllByText('١٢٬٥٠٠ EGP').length).toBe(2)
    expect(screen.getAllByText('٣٬١٢٥ EGP').length).toBe(2)
    // best seller row: 900000 minor / 2 orders = 4,500 EGP average (unique)
    expect(screen.getByText('٤٬٥٠٠ EGP')).toBeInTheDocument()
  })

  it('applies the "today" preset and queries the API with a same-day range shifted to the half-open [from, to) contract', async () => {
    let queriedFrom: string | null = null
    let queriedTo: string | null = null
    let requestCount = 0

    server.use(
      http.get(summaryUrl, ({ request }) => {
        requestCount += 1
        const url = new URL(request.url)
        queriedFrom = url.searchParams.get('from')
        queriedTo = url.searchParams.get('to')
        return HttpResponse.json({
          from: queriedFrom,
          to: queriedTo,
          currency: 'EGP',
          timezone: 'Africa/Cairo',
          revenueMinor: 50000,
          ordersCount: 1,
          bestSeller: null,
        })
      }),
    )

    const user = userEvent.setup()
    renderWithProviders(<TeacherSalesPage />)
    await screen.findByText('المبيعات')

    const today = new Date()
    await user.click(screen.getByRole('button', { name: 'اليوم' }))
    await user.click(screen.getByRole('button', { name: 'بحث بالفلاتر' }))

    await waitFor(() => expect(requestCount).toBe(2))

    // The user picked the same calendar day for "from" and "to". The API's
    // range is half-open, so sending that day for both would silently
    // return zero results (or a 400, since from >= to) — the request must
    // shift "to" one day forward so the selected day is actually included.
    expect(queriedFrom).toBe(isoDate(today))
    expect(queriedTo).toBe(isoDate(addDays(today, 1)))
  })

  it('applies the "last 7 days" preset with a correctly shifted end boundary', async () => {
    let queriedFrom: string | null = null
    let queriedTo: string | null = null

    server.use(
      http.get(summaryUrl, ({ request }) => {
        const url = new URL(request.url)
        queriedFrom = url.searchParams.get('from')
        queriedTo = url.searchParams.get('to')
        return HttpResponse.json({
          from: queriedFrom,
          to: queriedTo,
          currency: 'EGP',
          timezone: 'Africa/Cairo',
          revenueMinor: 0,
          ordersCount: 0,
          bestSeller: null,
        })
      }),
    )

    const user = userEvent.setup()
    renderWithProviders(<TeacherSalesPage />)
    await screen.findByText('المبيعات')

    const today = new Date()
    await user.click(screen.getByRole('button', { name: 'آخر 7 أيام' }))
    await user.click(screen.getByRole('button', { name: 'بحث بالفلاتر' }))

    await waitFor(() => expect(queriedFrom).not.toBeNull())

    expect(queriedFrom).toBe(isoDate(addDays(today, -7)))
    expect(queriedTo).toBe(isoDate(addDays(today, 1)))
  })

  it('rejects an invalid range (from after to) locally with a toast, without calling the API again', async () => {
    let requestCount = 0
    server.use(
      http.get(summaryUrl, () => {
        requestCount += 1
        return HttpResponse.json({
          from: null,
          to: null,
          currency: 'EGP',
          timezone: 'Africa/Cairo',
          revenueMinor: 0,
          ordersCount: 0,
          bestSeller: null,
        })
      }),
    )

    const alertSpy = vi.spyOn(window, 'alert')
    const user = userEvent.setup()
    renderWithProviders(<TeacherSalesPage />)
    await screen.findByText('المبيعات')
    await waitFor(() => expect(requestCount).toBe(1))

    // Pick day 20 for "from" and day 5 for "to" within the current
    // calendar month (both dates exist in every month) so from > to.
    await user.click(screen.getByLabelText('من تاريخ'))
    await user.click(screen.getByRole('button', { name: '20' }))

    await user.click(screen.getByLabelText('إلى تاريخ'))
    await user.click(screen.getByRole('button', { name: '5' }))

    await user.click(screen.getByRole('button', { name: 'بحث بالفلاتر' }))

    expect(await screen.findByText('تاريخ "من" يجب أن يكون قبل تاريخ "إلى"')).toBeInTheDocument()
    expect(alertSpy).not.toHaveBeenCalled()
    // no second request was fired for the invalid range
    expect(requestCount).toBe(1)
  })

  it('renders an empty state when there are no sales in the period, with valid zero stats and a disabled export', async () => {
    server.use(
      http.get(summaryUrl, () =>
        HttpResponse.json({
          from: null,
          to: null,
          currency: 'EGP',
          timezone: 'Africa/Cairo',
          revenueMinor: 0,
          ordersCount: 0,
          bestSeller: null,
        }),
      ),
    )

    renderWithProviders(<TeacherSalesPage />)

    expect(await screen.findByText('لا توجد مبيعات خلال الفترة المحددة')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /تصدير/ })).toBeDisabled()
    // both the revenue tile and the avg-order-value tile fall back to zero
    expect(screen.getAllByText('٠ EGP').length).toBe(2)
    expect(screen.queryByText(/NaN/)).not.toBeInTheDocument()
  })

  it('never renders NaN/undefined when the API returns malformed numeric fields', async () => {
    server.use(
      http.get(summaryUrl, () =>
        HttpResponse.json({
          from: null,
          to: null,
          currency: 'EGP',
          timezone: 'Africa/Cairo',
          revenueMinor: null,
          ordersCount: null,
          bestSeller: null,
        }),
      ),
    )

    renderWithProviders(<TeacherSalesPage />)

    await screen.findByText('المبيعات')
    expect(screen.queryByText(/NaN/)).not.toBeInTheDocument()
    expect(screen.queryByText('undefined')).not.toBeInTheDocument()
    expect(screen.queryByText('null')).not.toBeInTheDocument()
  })

  it('shows an unavailable state with retry when the endpoint fails, and recovers after retry', async () => {
    let shouldFail = true
    server.use(
      http.get(summaryUrl, () => {
        if (shouldFail) {
          return HttpResponse.json({ message: 'not ready' }, { status: 503 })
        }
        return HttpResponse.json({
          from: null,
          to: null,
          currency: 'EGP',
          timezone: 'Africa/Cairo',
          revenueMinor: 10000,
          ordersCount: 1,
          bestSeller: null,
        })
      }),
    )

    const user = userEvent.setup()
    renderWithProviders(<TeacherSalesPage />)

    expect(await screen.findByText('المبيعات غير متاحة حالياً')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /إعادة المحاولة/ })).toBeInTheDocument()

    shouldFail = false
    await user.click(screen.getByRole('button', { name: /إعادة المحاولة/ }))

    expect(await screen.findByText('تفاصيل مبيعات الدورات')).toBeInTheDocument()
    expect(screen.queryByText('المبيعات غير متاحة حالياً')).not.toBeInTheDocument()
  })

  it('shows a forbidden state for a 403 response instead of the generic error UI', async () => {
    server.use(
      http.get(summaryUrl, () =>
        HttpResponse.json({ message: 'Forbidden' }, { status: 403 }),
      ),
    )

    renderWithProviders(<TeacherSalesPage />)

    expect(await screen.findByText('غير مسموح لك بالوصول')).toBeInTheDocument()
    expect(screen.queryByText('المبيعات غير متاحة حالياً')).not.toBeInTheDocument()
  })

  it('exports currently-filtered data as CSV with escaped quotes and a meaningful filename', async () => {
    server.use(
      http.get(summaryUrl, () =>
        HttpResponse.json({
          from: null,
          to: null,
          currency: 'EGP',
          timezone: 'Africa/Cairo',
          revenueMinor: 900000,
          ordersCount: 2,
          bestSeller: {
            courseId: 'course-1',
            title: 'دورة "الفيزياء" المتقدمة, الجزء 1',
            ordersCount: 2,
            revenueMinor: 900000,
          },
        }),
      ),
    )

    let capturedBlob: Blob | null = null
    const createObjectURL = vi.fn((blob: Blob) => {
      capturedBlob = blob
      return 'blob:mock-url'
    })
    URL.createObjectURL = createObjectURL as typeof URL.createObjectURL
    URL.revokeObjectURL = vi.fn()
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})

    const user = userEvent.setup()
    renderWithProviders(<TeacherSalesPage />)

    await user.click(await screen.findByRole('button', { name: /تصدير/ }))

    await waitFor(() => expect(clickSpy).toHaveBeenCalledTimes(1))
    expect(createObjectURL).toHaveBeenCalledTimes(1)
    expect(clickSpy.mock.instances[0]).toHaveProperty('download', 'sales-report-all-to-all.csv')

    expect(capturedBlob).not.toBeNull()
    // jsdom's Blob has no .text(); read it back via FileReader instead.
    const text = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = () => reject(reader.error)
      reader.readAsText(capturedBlob as Blob)
    })
    // quotes inside the course title must be doubled, not left dangling
    expect(text).toContain('""الفيزياء""')
    // the comma inside the title must not split the CSV column
    expect(text).toContain('"دورة ""الفيزياء"" المتقدمة, الجزء 1"')
    expect(text).toContain('٩٬٠٠٠ EGP')
  })
})
