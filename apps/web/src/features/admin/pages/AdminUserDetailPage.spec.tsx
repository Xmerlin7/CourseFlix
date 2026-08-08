import { Route, Routes } from 'react-router'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'
import { env } from '../../../shared/lib/env'
import { server } from '../../../testing/mocks/server'
import { renderWithProviders } from '../../../testing/renderWithProviders'
import { AdminUserDetailPage } from './AdminUserDetailPage'

const apiUrl = (path: string) => `${env.apiBaseUrl}${path}`

function renderPage(initialEntries = ['/admin/users/student-123']) {
  return renderWithProviders(
    <Routes>
      <Route path="/admin/users/:userId" element={<AdminUserDetailPage />} />
      <Route path="/admin/users" element={<div>قائمة المستخدمين</div>} />
    </Routes>,
    { initialEntries },
  )
}

describe('AdminUserDetailPage — Student Deletion Flow', () => {
  it('opens custom confirmation modal when clicking delete student button', async () => {
    const user = userEvent.setup()
    const confirmSpy = vi.spyOn(window, 'confirm')

    renderPage()

    expect(await screen.findByText('طالب تجريبي')).toBeInTheDocument()

    const deleteBtn = screen.getByRole('button', { name: /حذف المستخدم/i })
    await user.click(deleteBtn)

    // Verify native confirm was NOT called
    expect(confirmSpy).not.toHaveBeenCalled()

    // Verify custom modal is opened with expected text
    expect(screen.getByRole('heading', { name: 'حذف الطالب' })).toBeInTheDocument()
    expect(
      screen.getByText('هل أنت متأكد من حذف هذا الطالب؟ لا يمكن التراجع عن هذا الإجراء.'),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'إلغاء' })).toBeInTheDocument()
    expect(screen.getByTestId('confirm-modal-confirm')).toBeInTheDocument()

    confirmSpy.mockRestore()
  })

  it('cancels deletion when clicking Cancel button and does not call delete API', async () => {
    const user = userEvent.setup()
    let deleteCalled = false

    server.use(
      http.delete(apiUrl('/admin/users/:userId'), () => {
        deleteCalled = true
        return new HttpResponse(null, { status: 204 })
      }),
    )

    renderPage()

    expect(await screen.findByText('طالب تجريبي')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /حذف المستخدم/i }))
    expect(screen.getByRole('heading', { name: 'حذف الطالب' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'إلغاء' }))

    expect(screen.queryByRole('heading', { name: 'حذف الطالب' })).not.toBeInTheDocument()
    expect(deleteCalled).toBe(false)
  })

  it('calls delete API and shows success toast when confirming deletion', async () => {
    const user = userEvent.setup()
    let deleteCalled = false

    server.use(
      http.delete(apiUrl('/admin/users/:userId'), () => {
        deleteCalled = true
        return new HttpResponse(null, { status: 204 })
      }),
    )

    renderPage()

    expect(await screen.findByText('طالب تجريبي')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /حذف المستخدم/i }))
    await user.click(screen.getByTestId('confirm-modal-confirm'))

    expect(deleteCalled).toBe(true)
    expect(await screen.findByText('تم حذف الطالب بنجاح')).toBeInTheDocument()
  })

  it('shows error toast when deletion request fails', async () => {
    const user = userEvent.setup()

    server.use(
      http.delete(apiUrl('/admin/users/:userId'), () => {
        return new HttpResponse(JSON.stringify({ message: 'Internal Server Error' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        })
      }),
    )

    renderPage()

    expect(await screen.findByText('طالب تجريبي')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /حذف المستخدم/i }))
    await user.click(screen.getByTestId('confirm-modal-confirm'))

    expect(
      await screen.findByText('حدث خطأ أثناء حذف الطالب. حاول مرة أخرى.'),
    ).toBeInTheDocument()
  })

  it('disables confirm button and prevents duplicate requests during processing', async () => {
    const user = userEvent.setup()
    let deleteCallCount = 0

    server.use(
      http.delete(apiUrl('/admin/users/:userId'), async () => {
        deleteCallCount++
        // Delay response to allow testing loading/disabled state
        await new Promise((resolve) => setTimeout(resolve, 200))
        return new HttpResponse(null, { status: 204 })
      }),
    )

    renderPage()

    expect(await screen.findByText('طالب تجريبي')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /حذف المستخدم/i }))

    const confirmBtn = screen.getByTestId('confirm-modal-confirm')
    await user.click(confirmBtn)

    // Button should immediately show loading state and be disabled
    expect(confirmBtn).toBeDisabled()
    expect(screen.getByText('جارٍ التنفيذ...')).toBeInTheDocument()

    // Attempt second click while request is in flight
    await user.click(confirmBtn)

    await waitFor(() => {
      expect(screen.getByText('تم حذف الطالب بنجاح')).toBeInTheDocument()
    })

    // Delete API should only have been called ONCE
    expect(deleteCallCount).toBe(1)
  })
})
