import { useEffect, useRef } from 'react'
import { handleChatInputKeyDown } from '../../../shared/utils/chatInput'

interface MessageComposerProps {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  disabled?: boolean
  isSending?: boolean
}

export function MessageComposer({ value, onChange, onSubmit, disabled, isSending }: MessageComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return
    textarea.style.height = 'auto'
    const newHeight = Math.min(textarea.scrollHeight, 140)
    textarea.style.height = `${Math.max(40, newHeight)}px`
  }, [value])

  const canSubmit = !disabled && Boolean(value.trim())

  function handleSubmit() {
    if (!canSubmit) return
    onSubmit()
    requestAnimationFrame(() => {
      textareaRef.current?.focus()
    })
  }

  return (
    <form
      className="chat-composer"
      onSubmit={(event) => {
        event.preventDefault()
        handleSubmit()
      }}
    >
      <div className="chat-composer-field">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => handleChatInputKeyDown(event, handleSubmit, !canSubmit)}
          rows={1}
          maxLength={10000}
          disabled={disabled}
          placeholder="اكتب رسالتك..."
          aria-label="اكتب ردًا"
        />
      </div>
      <button
        type="submit"
        className="icon-btn filled chat-composer-send"
        disabled={!canSubmit}
        aria-label="إرسال"
      >
        <span className={`ms${isSending ? ' spin' : ''}`} aria-hidden="true">
          {isSending ? 'progress_activity' : 'send'}
        </span>
      </button>
    </form>
  )
}

