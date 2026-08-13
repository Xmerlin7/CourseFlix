import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../../../testing/renderWithProviders'
import { RegisterForm } from './RegisterForm'

describe('RegisterForm', () => {
  it('validates and advances through the existing wizard steps', async () => {
    const user = userEvent.setup()

    renderWithProviders(<RegisterForm />, {
      auth: {
        user: null,
        isLoading: false,
        login: vi.fn(),
        logout: vi.fn(),
        register: vi.fn(),
        updateUser: vi.fn(),
        verifyOtp: vi.fn(),
      },
    })

    await user.click(screen.getByRole('button', { name: /التالي/ }))
    expect(screen.getByText('الاسم مطلوب')).toBeInTheDocument()

    await user.type(screen.getByLabelText('الاسم الكامل'), 'طالب جديد')
    await user.type(screen.getByLabelText('البريد الإلكتروني'), 'new@example.com')
    await user.click(screen.getByRole('button', { name: /التالي/ }))

    expect(screen.getByLabelText('كلمة المرور')).toBeInTheDocument()

    await user.type(screen.getByLabelText('كلمة المرور'), 'Password123')
    await user.type(screen.getByLabelText('تأكيد كلمة المرور'), 'Password123')
    await user.click(screen.getByRole('button', { name: /التالي/ }))

    expect(screen.getByLabelText('وافقت على الشروط والأحكام')).toBeInTheDocument()
  })
})
