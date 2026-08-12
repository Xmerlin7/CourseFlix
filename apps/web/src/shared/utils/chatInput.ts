import type React from 'react'

/**
 * Handles Enter to submit and Shift+Enter for newlines in AI chat inputs.
 * - Pressing Enter (without Shift): Prevents default newline insertion and submits form/handler if not disabled.
 * - Pressing Shift+Enter: Allows default newline insertion.
 * - Ignores Enter during IME composition (e.g. Arabic IME input methods).
 */
export function handleChatInputKeyDown<
  T extends HTMLTextAreaElement | HTMLInputElement = HTMLTextAreaElement,
>(
  event: React.KeyboardEvent<T>,
  onSubmit: () => void,
  disabled?: boolean,
) {
  if (event.key === 'Enter' && !event.shiftKey) {
    if (event.nativeEvent.isComposing) {
      return
    }
    event.preventDefault()
    if (!disabled) {
      onSubmit()
    }
  }
}
