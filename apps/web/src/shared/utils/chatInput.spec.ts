import type React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { handleChatInputKeyDown } from './chatInput'

function createKeyboardEvent(
  key: string,
  shiftKey = false,
  isComposing = false,
): React.KeyboardEvent<HTMLTextAreaElement> {
  const preventDefault = vi.fn()
  return {
    key,
    shiftKey,
    nativeEvent: { isComposing } as KeyboardEvent,
    preventDefault,
  } as unknown as React.KeyboardEvent<HTMLTextAreaElement>
}

describe('handleChatInputKeyDown', () => {
  it('calls onSubmit and prevents default when Enter is pressed without Shift', () => {
    const onSubmit = vi.fn()
    const event = createKeyboardEvent('Enter', false)

    handleChatInputKeyDown(event, onSubmit, false)

    expect(event.preventDefault).toHaveBeenCalledTimes(1)
    expect(onSubmit).toHaveBeenCalledTimes(1)
  })

  it('allows newline (does not call preventDefault or onSubmit) when Shift+Enter is pressed', () => {
    const onSubmit = vi.fn()
    const event = createKeyboardEvent('Enter', true)

    handleChatInputKeyDown(event, onSubmit, false)

    expect(event.preventDefault).not.toHaveBeenCalled()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('prevents default but does NOT call onSubmit when disabled is true', () => {
    const onSubmit = vi.fn()
    const event = createKeyboardEvent('Enter', false)

    handleChatInputKeyDown(event, onSubmit, true)

    expect(event.preventDefault).toHaveBeenCalledTimes(1)
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('does nothing during IME composition', () => {
    const onSubmit = vi.fn()
    const event = createKeyboardEvent('Enter', false, true)

    handleChatInputKeyDown(event, onSubmit, false)

    expect(event.preventDefault).not.toHaveBeenCalled()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('does nothing for non-Enter keys', () => {
    const onSubmit = vi.fn()
    const event = createKeyboardEvent('a', false)

    handleChatInputKeyDown(event, onSubmit, false)

    expect(event.preventDefault).not.toHaveBeenCalled()
    expect(onSubmit).not.toHaveBeenCalled()
  })
})
