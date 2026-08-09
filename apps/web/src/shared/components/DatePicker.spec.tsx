import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { DatePicker } from './DatePicker'

describe('DatePicker', () => {
  it('renders input with placeholder when no value is provided', () => {
    render(<DatePicker id="test-date" label="من تاريخ" value="" onChange={vi.fn()} />)

    expect(screen.getByLabelText('من تاريخ')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('اختر التاريخ...')).toBeInTheDocument()
  })

  it('opens calendar dialog on input click and selects a day', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()

    render(<DatePicker id="test-date" label="من تاريخ" value="2026-08-01" onChange={onChange} />)

    await user.click(screen.getByLabelText('من تاريخ'))

    expect(screen.getByRole('dialog', { name: 'اختيار التاريخ' })).toBeInTheDocument()
    expect(screen.getByText('أغسطس 2026')).toBeInTheDocument()

    // Click day 15
    await user.click(screen.getByRole('button', { name: '15' }))

    expect(onChange).toHaveBeenCalledWith('2026-08-15')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('clears date when clicking clear button', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()

    render(<DatePicker id="test-date" value="2026-08-01" onChange={onChange} />)

    await user.click(screen.getByRole('button', { name: 'فتح التقويم' }))
    await user.click(screen.getByRole('button', { name: 'مسح' }))

    expect(onChange).toHaveBeenCalledWith('')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
