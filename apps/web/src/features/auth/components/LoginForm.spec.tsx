import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { LoginForm } from './LoginForm'
import { renderWithProviders } from '../../../testing/renderWithProviders'
import type { AuthUser } from '../types/auth.types'

describe('LoginForm', () => {
  it('submits credentials through the auth provider', async () => {
    const user = userEvent.setup()
    const login = vi.fn(
      async (): Promise<AuthUser> => ({
        id: 'student-1',
        email: 'student@courseflix.local',
        role: 'student',
        fullName: 'عبدالله حبسه',
        avatarUrl: null,
      }),
    )

    renderWithProviders(<LoginForm />, { auth: { login } })

    await user.type(screen.getByLabelText('البريد الإلكتروني'), 'student@courseflix.local')
    await user.type(screen.getByLabelText('كلمة المرور'), 'Student123!')
    await user.click(screen.getByRole('button', { name: /تسجيل الدخول/ }))

    expect(login).toHaveBeenCalledWith({
      email: 'student@courseflix.local',
      password: 'Student123!',
    })
  })
})
