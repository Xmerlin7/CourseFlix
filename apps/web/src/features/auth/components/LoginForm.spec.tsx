import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../../../testing/renderWithProviders'
import { LoginForm } from './LoginForm'

describe('LoginForm', () => {
  it('renders and submits with the shared test harness', async () => {
    const user = userEvent.setup()
    const login = vi.fn().mockResolvedValue({
      id: 'student-1',
      email: 'student@example.com',
      fullName: 'طالب تجريبي',
      role: 'student',
      avatarUrl: null,
    })

    renderWithProviders(<LoginForm />, {
      auth: {
        user: null,
        isLoading: false,
        login,
        logout: vi.fn(),
        register: vi.fn(),
        updateUser: vi.fn(),
        verifyOtp: vi.fn(),
      },
    })

    await user.type(screen.getByLabelText('البريد الإلكتروني'), 'student@example.com')
    await user.type(screen.getByLabelText('كلمة المرور'), 'password123')
    await user.click(screen.getByRole('button', { name: /تسجيل الدخول/ }))

    expect(login).toHaveBeenCalledWith({
      email: 'student@example.com',
      password: 'password123',
      requireOtp: false,
    })
  })
})
