import { Route, Routes } from 'react-router'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import { env } from '../../../shared/lib/env'
import { server } from '../../../testing/mocks/server'
import { renderWithProviders } from '../../../testing/renderWithProviders'
import { CheckoutPage } from './CheckoutPage'
function renderPage(courseId = 'course-1') {
  return renderWithProviders(
    <Routes>
      <Route path="/student/checkout/:courseId" element={<CheckoutPage />} />
    </Routes>,
    { initialEntries: [`/student/checkout/${courseId}`] },
  )
}

function pendingOrder(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    orderReference: 'order-1',
    status: 'pending',
    paymentStatus: 'pending',
    currency: 'EGP',
    amountMinor: 50000,
    timezone: 'Africa/Cairo',
    items: [{ courseId: 'course-1', title: 'الميكانيكا الكلاسيكية', priceMinor: 50000 }],
    createdAt: '2026-08-04T10:00:00.000Z',
    paidAt: null,
    ...overrides,
  }
}

async function fillCardForm(user: ReturnType<typeof userEvent.setup>, number: string) {
  await user.type(screen.getByLabelText('اسم حامل البطاقة'), 'محمد أحمد')
  await user.type(screen.getByLabelText('رقم البطاقة'), number)
  await user.type(screen.getByLabelText('تاريخ الانتهاء'), '12/28')
  await user.type(screen.getByLabelText('رمز الأمان (CVV)'), '123')
}

describe('CheckoutPage', () => {
  it('creates a draft order and embeds the Paymob gateway when the student pays through Paymob', async () => {
    const paymentUrl = 'https://accept.paymob.com/api/acceptance/iframes/1234?payment_token=token-1'

    server.use(
      http.post(`${env.apiBaseUrl}/checkout/orders`, () =>
        HttpResponse.json(pendingOrder(), { status: 201 }),
      ),
      http.post(`${env.apiBaseUrl}/paymob/orders/order-1/pay`, () =>
        HttpResponse.json({ paymentUrl, paymobOrderId: '9001' }),
      ),
    )

    const user = userEvent.setup()
    renderPage()

    expect(await screen.findByText('الميكانيكا الكلاسيكية')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'الدفع عبر بوابة Paymob' }))

    await waitFor(() => {
      const frame = screen.getByTitle('بوابة الدفع الآمنة') as HTMLIFrameElement
      expect(frame.getAttribute('src')).toBe(paymentUrl)
    })
  })

  it('shows an error when Paymob initiation fails', async () => {
    server.use(
      http.post(`${env.apiBaseUrl}/checkout/orders`, () =>
        HttpResponse.json(pendingOrder(), { status: 201 }),
      ),
      http.post(`${env.apiBaseUrl}/paymob/orders/order-1/pay`, () =>
        HttpResponse.json(
          { statusCode: 502, message: 'bad gateway', error: 'Bad Gateway' },
          { status: 502 },
        ),
      ),
    )

    const user = userEvent.setup()
    renderPage()

    expect(await screen.findByText('الميكانيكا الكلاسيكية')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'الدفع عبر بوابة Paymob' }))

    expect(
      await screen.findByText('تعذر الاتصال بمزود الدفع. يرجى المحاولة مرة أخرى.'),
    ).toBeInTheDocument()
    expect(screen.getByText('bad gateway')).toBeInTheDocument()
  })

  it('pays a valid simulated card and shows the paid receipt', async () => {
    server.use(
      http.post(`${env.apiBaseUrl}/checkout/orders`, () =>
        HttpResponse.json(pendingOrder(), { status: 201 }),
      ),
      http.post(`${env.apiBaseUrl}/checkout/orders/order-1/confirm`, () =>
        HttpResponse.json(
          pendingOrder({ status: 'paid', paymentStatus: 'paid', paidAt: '2026-08-04T10:05:00.000Z' }),
        ),
      ),
    )

    const user = userEvent.setup()
    renderPage()

    await screen.findByText('الميكانيكا الكلاسيكية')
    await fillCardForm(user, '5123456789012345')
    await user.click(screen.getByRole('button', { name: 'ادفع الآن' }))

    expect(await screen.findByText('تم الدفع بنجاح')).toBeInTheDocument()
  })

  it('shows the declined message when the test decline card is used', async () => {
    server.use(
      http.post(`${env.apiBaseUrl}/checkout/orders`, () =>
        HttpResponse.json(pendingOrder(), { status: 201 }),
      ),
      http.post(`${env.apiBaseUrl}/checkout/orders/order-1/confirm`, () =>
        HttpResponse.json(pendingOrder({ status: 'failed', paymentStatus: 'failed' })),
      ),
    )

    const user = userEvent.setup()
    renderPage()

    await screen.findByText('الميكانيكا الكلاسيكية')
    await fillCardForm(user, '4242424242424242')
    await user.click(screen.getByRole('button', { name: 'ادفع الآن' }))

    expect(await screen.findByText('تم رفض عملية الدفع')).toBeInTheDocument()
  })

  it('validates the card fields before submitting', async () => {
    server.use(
      http.post(`${env.apiBaseUrl}/checkout/orders`, () =>
        HttpResponse.json(pendingOrder(), { status: 201 }),
      ),
    )

    const user = userEvent.setup()
    renderPage()

    await screen.findByText('الميكانيكا الكلاسيكية')
    await user.click(screen.getByRole('button', { name: 'ادفع الآن' }))

    expect(await screen.findByText('أدخل اسم حامل البطاقة')).toBeInTheDocument()
    expect(screen.getByText('رقم البطاقة غير صحيح')).toBeInTheDocument()
    expect(screen.getByText('تاريخ انتهاء غير صحيح')).toBeInTheDocument()
    expect(screen.getByText('رمز الأمان غير صحيح')).toBeInTheDocument()
  })

  it('redirects to the explore-courses page when the student backs out', async () => {
    server.use(
      http.post(`${env.apiBaseUrl}/checkout/orders`, () =>
        HttpResponse.json(pendingOrder(), { status: 201 }),
      ),
    )

    const user = userEvent.setup()
    renderWithProviders(
      <Routes>
        <Route path="/student/checkout/:courseId" element={<CheckoutPage />} />
        <Route path="/student/browse" element={<div>استكشف الدورات</div>} />
      </Routes>,
      { initialEntries: ['/student/checkout/course-1'] },
    )

    await screen.findByText('الميكانيكا الكلاسيكية')
    await user.click(screen.getByRole('button', { name: 'الرجوع للدورات' }))

    expect(await screen.findByText('استكشف الدورات')).toBeInTheDocument()
  })

  it('shows a distinct already-owned message and links to the course instead of a broken checkout', async () => {
    server.use(
      http.post(`${env.apiBaseUrl}/checkout/orders`, () =>
        HttpResponse.json(
          { statusCode: 409, message: 'You already own this course.', error: 'Conflict' },
          { status: 409 },
        ),
      ),
    )

    renderPage('course-2')

    expect(await screen.findByText('أنت مسجل بالفعل في هذه الدورة')).toBeInTheDocument()
    const link = screen.getByRole('link', { name: 'الذهاب إلى الدورة' })
    expect(link).toHaveAttribute('href', '/student/courses/course-2')
  })

  it('shows a distinct message for an archived or draft course', async () => {
    server.use(
      http.post(`${env.apiBaseUrl}/checkout/orders`, () =>
        HttpResponse.json(
          { statusCode: 409, message: 'This course is not available for purchase.', error: 'Conflict' },
          { status: 409 },
        ),
      ),
    )

    renderPage('course-3')

    expect(await screen.findByText('هذه الدورة غير متاحة للشراء حالياً')).toBeInTheDocument()
  })

  it('shows a distinct message for an unknown course', async () => {
    server.use(
      http.post(`${env.apiBaseUrl}/checkout/orders`, () =>
        HttpResponse.json({ statusCode: 404, message: 'Course not found.', error: 'Not Found' }, { status: 404 }),
      ),
    )

    renderPage('course-missing')

    expect(await screen.findByText('الدورة غير موجودة')).toBeInTheDocument()
  })

  it('shows a generic fallback for an unexpected error without leaking raw details', async () => {
    server.use(
      http.post(`${env.apiBaseUrl}/checkout/orders`, () =>
        HttpResponse.json({ statusCode: 500, message: 'boom', error: 'Internal Server Error' }, { status: 500 }),
      ),
    )

    renderPage('course-4')

    await waitFor(() => {
      expect(screen.getByText('تعذر بدء عملية الشراء')).toBeInTheDocument()
    })
    expect(screen.queryByText('boom')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /إعادة المحاولة/ })).toBeInTheDocument()
  })

  it('fetches the paid receipt when returning from a successful Paymob payment', async () => {
    server.use(
      http.get(`${env.apiBaseUrl}/orders/order-1`, () =>
        HttpResponse.json(
          pendingOrder({
            status: 'paid',
            paymentStatus: 'paid',
            paidAt: '2026-08-04T10:05:00.000Z',
          }),
        ),
      ),
    )

    renderWithProviders(
      <Routes>
        <Route path="/student/checkout/:courseId" element={<CheckoutPage />} />
      </Routes>,
      { initialEntries: ['/student/checkout/course-1?order=order-1'] },
    )

    expect(await screen.findByText('تم الدفع بنجاح')).toBeInTheDocument()
    expect(screen.getByText(/order-1/)).toBeInTheDocument()
    const start = screen.getByRole('link', { name: /بدء التعلم/ })
    expect(start).toHaveAttribute('href', '/student/courses/course-1')
  })

  it('shows the checkout form for a pending order passed via the order query param', async () => {
    server.use(
      http.get(`${env.apiBaseUrl}/orders/order-1`, () =>
        HttpResponse.json(pendingOrder()),
      ),
    )

    renderWithProviders(
      <Routes>
        <Route path="/student/checkout/:courseId" element={<CheckoutPage />} />
      </Routes>,
      { initialEntries: ['/student/checkout/course-1?order=order-1'] },
    )

    expect(await screen.findByText('الميكانيكا الكلاسيكية')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'ادفع الآن' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'الدفع عبر بوابة Paymob' })).toBeInTheDocument()
  })
})