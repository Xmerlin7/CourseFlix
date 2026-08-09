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
    expect(screen.getByRole('button', { name: 'اختيار الشهر' })).toHaveTextContent('أغسطس')
    expect(screen.getByRole('button', { name: 'اختيار السنة' })).toHaveTextContent('2026')

    // Click day 15
    await user.click(screen.getByRole('button', { name: '15' }))

    expect(onChange).toHaveBeenCalledWith('2026-08-15')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('jumps to a different month via the month grid without changing the year', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()

    render(<DatePicker id="test-date" label="من تاريخ" value="2026-08-01" onChange={onChange} />)
    await user.click(screen.getByLabelText('من تاريخ'))

    await user.click(screen.getByRole('button', { name: 'اختيار الشهر' }))
    expect(screen.getByRole('grid', { name: 'اختيار الشهر' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'مارس' }))

    // back on the day grid, now showing March 2026
    expect(screen.getByRole('button', { name: 'اختيار الشهر' })).toHaveTextContent('مارس')
    expect(screen.getByRole('button', { name: 'اختيار السنة' })).toHaveTextContent('2026')

    await user.click(screen.getByRole('button', { name: '10' }))
    expect(onChange).toHaveBeenCalledWith('2026-03-10')
  })

  it('jumps to a different year via the year grid, landing on the month grid next', async () => {
    const user = userEvent.setup()

    render(<DatePicker id="test-date" label="من تاريخ" value="2026-08-01" onChange={vi.fn()} />)
    await user.click(screen.getByLabelText('من تاريخ'))

    await user.click(screen.getByRole('button', { name: 'اختيار السنة' }))
    expect(screen.getByRole('grid', { name: 'اختيار السنة' })).toBeInTheDocument()

    // 2020 falls inside the default 12-year window around 2026
    await user.click(screen.getByRole('button', { name: '2020' }))

    // picking a year drops into the month grid for that year next
    expect(screen.getByRole('grid', { name: 'اختيار الشهر' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'اختيار السنة' })).toHaveTextContent('2020')
  })

  it('opens the calendar upward when there is not enough room below the field', async () => {
    // Simulate the field sitting near the bottom of a short viewport —
    // not enough room below for the ~380px dropdown, but plenty above.
    const originalGetBoundingClientRect = HTMLElement.prototype.getBoundingClientRect
    HTMLElement.prototype.getBoundingClientRect = () =>
      ({ top: 750, bottom: 780, left: 0, right: 300, width: 300, height: 30, x: 0, y: 750, toJSON() {} }) as DOMRect
    const originalInnerHeight = window.innerHeight
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 800 })

    const user = userEvent.setup()
    render(<DatePicker id="test-date" label="من تاريخ" value="2026-08-01" onChange={vi.fn()} />)
    await user.click(screen.getByLabelText('من تاريخ'))

    const dialog = screen.getByRole('dialog', { name: 'اختيار التاريخ' })
    expect(dialog.style.bottom).toBe('calc(100% + 6px)')
    expect(dialog.style.top).toBe('')

    HTMLElement.prototype.getBoundingClientRect = originalGetBoundingClientRect
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: originalInnerHeight })
  })

  it('opens the calendar downward by default when there is enough room below', async () => {
    const user = userEvent.setup()
    render(<DatePicker id="test-date" label="من تاريخ" value="2026-08-01" onChange={vi.fn()} />)
    await user.click(screen.getByLabelText('من تاريخ'))

    const dialog = screen.getByRole('dialog', { name: 'اختيار التاريخ' })
    expect(dialog.style.top).toBe('calc(100% + 6px)')
    expect(dialog.style.bottom).toBe('')
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
