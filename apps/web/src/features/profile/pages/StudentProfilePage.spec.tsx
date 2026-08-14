import { fireEvent, screen, waitFor } from '@testing-library/react'
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
      verifyOtp: vi.fn(),
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

  it('uploads a custom photo via the "+" tile through POST /users/me/avatar', async () => {
    const user = userEvent.setup()
    server.use(
      http.post(`${env.apiBaseUrl}/users/me/avatar`, () =>
        HttpResponse.json({
          id: 'student-1',
          email: 'student@example.com',
          fullName: 'عبدالله حبسه',
          role: 'student',
          avatarUrl: 'https://res.cloudinary.com/demo/image/upload/v1/courseflix/avatars/x.png',
        }),
      ),
    )

    const { updateUser } = renderPage()

    await user.click(screen.getByRole('button', { name: 'تغيير الصورة الرمزية' }))
    const uploadInput: HTMLInputElement = screen.getByLabelText('رفع صورة من جهازك', { selector: 'input' })
    const file = new File(['x'], 'photo.png', { type: 'image/png' })
    Object.defineProperty(uploadInput, 'files', { value: [file] })
    fireEvent.change(uploadInput)

    expect(await screen.findByText('اتحفظت الصورة الرمزية')).toBeInTheDocument()
    await waitFor(() => expect(updateUser).toHaveBeenCalledWith(
      expect.objectContaining({ avatarUrl: expect.stringContaining('cloudinary') }),
    ))
  })

  it('rejects a non-image file client-side without calling the API', async () => {
    const user = userEvent.setup()
    let apiCalled = false
    server.use(
      http.post(`${env.apiBaseUrl}/users/me/avatar`, () => {
        apiCalled = true
        return HttpResponse.json({}, { status: 400 })
      }),
    )

    renderPage()

    await user.click(screen.getByRole('button', { name: 'تغيير الصورة الرمزية' }))
    const uploadInput: HTMLInputElement = screen.getByLabelText('رفع صورة من جهازك', { selector: 'input' })
    const file = new File(['x'], 'doc.pdf', { type: 'application/pdf' })
    Object.defineProperty(uploadInput, 'files', { value: [file] })
    fireEvent.change(uploadInput)

    expect(await screen.findByText(/الصور المسموح بها/)).toBeInTheDocument()
    expect(apiCalled).toBe(false)
  })

  it('renders working links for the real nav targets and the disabled purchase row', () => {
    renderPage()

    expect(screen.getByRole('link', { name: /دوراتي/ })).toHaveAttribute('href', '/student/courses')
    expect(screen.getByRole('link', { name: /الإشعارات/ })).toHaveAttribute('href', '/student/notifications')

    const purchasesRow = screen.getByText('مشترياتي').closest('.list-item')
    expect(purchasesRow).toHaveAttribute('aria-disabled', 'true')
  })

  it('shows the AI-credit quota card for a teacher, with the remaining balance', async () => {
    renderPage({
      auth: {
        user: {
          id: 'teacher-1',
          email: 'teacher@example.com',
          fullName: 'محمد عبدالرحمن',
          role: 'teacher',
          avatarUrl: null,
        },
        isLoading: false,
        login: vi.fn(),
        logout: vi.fn(),
        register: vi.fn(),
        verifyOtp: vi.fn(),
        updateUser: vi.fn(),
      },
    })

    expect(screen.getByText('حصتك الشهرية')).toBeInTheDocument()
    expect(await screen.findByText('75')).toBeInTheDocument()
    expect(screen.getByText(/بيتجدد أول كل شهر/)).toBeInTheDocument()
  })

  it('lets a teacher save the WhatsApp number that controls the student floating button', async () => {
    const user = userEvent.setup()
    server.use(
      http.patch(`${env.apiBaseUrl}/users/me/profile`, async ({ request }) => {
        const body = (await request.json()) as { whatsappNumber?: string | null }
        return HttpResponse.json({
          id: 'teacher-1',
          email: 'teacher@example.com',
          fullName: 'محمد عبدالرحمن',
          role: 'teacher',
          avatarUrl: null,
          whatsappNumber: body.whatsappNumber ? '201001112233' : null,
        })
      }),
    )

    const updateUser = vi.fn()
    renderPage({
      auth: {
        user: {
          id: 'teacher-1',
          email: 'teacher@example.com',
          fullName: 'محمد عبدالرحمن',
          role: 'teacher',
          avatarUrl: null,
          whatsappNumber: null,
        },
        isLoading: false,
        login: vi.fn(),
        logout: vi.fn(),
        register: vi.fn(),
        verifyOtp: vi.fn(),
        updateUser,
      },
    })

    await user.type(screen.getByLabelText('رقم واتساب'), '01001112233')
    await user.click(screen.getByRole('button', { name: 'حفظ رقم واتساب' }))

    expect(await screen.findByText('اتحفظ رقم واتساب بنجاح')).toBeInTheDocument()
    await waitFor(() => expect(updateUser).toHaveBeenCalledWith(
      expect.objectContaining({ whatsappNumber: '201001112233' }),
    ))
  })

  it('never shows the quota card to a student', () => {
    renderPage()

    expect(screen.queryByText('حصتك الشهرية')).not.toBeInTheDocument()
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
