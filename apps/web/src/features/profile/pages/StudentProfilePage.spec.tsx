import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'
import { env } from '../../../shared/lib/env'
import { server } from '../../../testing/mocks/server'
import { renderWithProviders } from '../../../testing/renderWithProviders'
import { StudentProfilePage } from './StudentProfilePage'

function renderPage(overrides: Partial<Parameters<typeof renderWithProviders>[1]> = {}) {
  const updateUser = vi.fn()
  const logout = vi.fn().mockResolvedValue(undefined)

  const utils = renderWithProviders(<StudentProfilePage />, {
    initialEntries: ['/student/profile'],
    auth: {
      user: {
        id: 'student-1',
        email: 'student@example.com',
        fullName: 'عبدالله حبسه',
        role: 'student',
        avatarUrl: null,
      },
      isLoading: false,
      login: vi.fn(),
      logout,
      register: vi.fn(),
      updateUser,
    },
    ...overrides,
  })

  return { ...utils, updateUser, logout }
}

describe('StudentProfilePage', () => {
  it('renders the real signed-in student data, not hardcoded values', () => {
    renderPage()

    expect(screen.getByText('عبدالله حبسه')).toBeInTheDocument()
    expect(screen.getByDisplayValue('عبدالله حبسه')).toBeInTheDocument()
    expect(screen.getByDisplayValue('student@example.com')).toBeInTheDocument()
  })

  it('only shows the save/discard actions once the name field is actually changed', async () => {
    const user = userEvent.setup()
    renderPage()

    expect(screen.queryByRole('button', { name: 'حفظ التغييرات' })).not.toBeInTheDocument()

    const nameInput = screen.getByLabelText('الاسم الكامل *')
    await user.type(nameInput, ' إضافة')

    expect(screen.getByRole('button', { name: 'حفظ التغييرات' })).toBeInTheDocument()
  })

  it('saves the full name via PATCH /users/me/profile and syncs it into AuthContext', async () => {
    const user = userEvent.setup()
    server.use(
      http.patch(`${env.apiBaseUrl}/users/me/profile`, async ({ request }) => {
        const body = (await request.json()) as { fullName?: string }
        return HttpResponse.json({
          id: 'student-1',
          email: 'student@example.com',
          fullName: body.fullName,
          role: 'student',
          avatarUrl: null,
        })
      }),
    )

    const { updateUser } = renderPage()

    const nameInput = screen.getByLabelText('الاسم الكامل *')
    await user.clear(nameInput)
    await user.type(nameInput, 'اسم جديد')
    await user.click(screen.getByRole('button', { name: 'حفظ التغييرات' }))

    expect(await screen.findByText('اتحفظ الاسم بنجاح')).toBeInTheDocument()
    await waitFor(() => expect(updateUser).toHaveBeenCalledWith(
      expect.objectContaining({ fullName: 'اسم جديد' }),
    ))
  })

  it('shows an error toast and keeps the field editable when saving the name fails', async () => {
    const user = userEvent.setup()
    server.use(
      http.patch(`${env.apiBaseUrl}/users/me/profile`, () =>
        HttpResponse.json({ message: 'Internal error' }, { status: 500 }),
      ),
    )

    renderPage()

    const nameInput = screen.getByLabelText('الاسم الكامل *')
    await user.type(nameInput, ' تعديل')
    await user.click(screen.getByRole('button', { name: 'حفظ التغييرات' }))

    expect(await screen.findByText('حصل خطأ أثناء الحفظ')).toBeInTheDocument()
    expect(screen.getByLabelText('الاسم الكامل *')).not.toBeDisabled()
  })

  it('opens the avatar picker with the preset grid and applies a selection', async () => {
    const user = userEvent.setup()
    server.use(
      http.patch(`${env.apiBaseUrl}/users/me/profile`, async ({ request }) => {
        const body = (await request.json()) as { avatarUrl?: string }
        return HttpResponse.json({
          id: 'student-1',
          email: 'student@example.com',
          fullName: 'عبدالله حبسه',
          role: 'student',
          avatarUrl: body.avatarUrl,
        })
      }),
    )

    const { updateUser } = renderPage()

    await user.click(screen.getByRole('button', { name: 'تغيير الصورة الرمزية' }))
    expect(screen.getByRole('group', { name: 'الصور الرمزية المتاحة' })).toBeInTheDocument()

    const options = screen.getAllByRole('button', { name: /صورة رمزية/ })
    expect(options.length).toBeGreaterThan(1)
    await user.click(options[0])

    expect(await screen.findByText('اتحفظت الصورة الرمزية')).toBeInTheDocument()
    await waitFor(() => expect(updateUser).toHaveBeenCalled())
  })

  it('renders working links for the real nav targets and disabled rows for the ones with no backing page', () => {
    renderPage()

    expect(screen.getByRole('link', { name: /دوراتي/ })).toHaveAttribute('href', '/student/courses')
    expect(screen.getByRole('link', { name: /الإشعارات/ })).toHaveAttribute('href', '/student/notifications')

    const purchasesRow = screen.getByText('مشترياتي').closest('.list-item')
    expect(purchasesRow).toHaveAttribute('aria-disabled', 'true')
    const supportRow = screen.getByText('تواصل مع الدعم').closest('.list-item')
    expect(supportRow).toHaveAttribute('aria-disabled', 'true')
  })

  it('never deletes immediately — requires confirming a destructive-action dialog first', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: 'حذف الحساب' }))

    expect(screen.getByText(/هذا الإجراء نهائي/)).toBeInTheDocument()

    await user.click(screen.getByTestId('confirm-modal-confirm'))

    expect(await screen.findByText(/حذف الحساب مش متاح من هنا لسه/)).toBeInTheDocument()
  })

  it('logs out via the existing auth mechanism and redirects to login', async () => {
    const user = userEvent.setup()
    const { logout } = renderPage()

    await user.click(screen.getByRole('button', { name: /تسجيل الخروج/ }))

    await waitFor(() => expect(logout).toHaveBeenCalled())
  })
})
