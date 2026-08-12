import { handleChatInputKeyDown } from '../../../shared/utils/chatInput'

interface MessageComposerProps {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  disabled?: boolean
  isSending?: boolean
}

export function MessageComposer({ value, onChange, onSubmit, disabled, isSending }: MessageComposerProps) {
  return (
    <form
      className="chat-composer"
      onSubmit={(event) => {
        event.preventDefault()
        onSubmit()
      }}
    >
      <div className="chat-composer-field">
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => handleChatInputKeyDown(event, onSubmit, disabled || !value.trim())}
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
        disabled={disabled || !value.trim()}
        aria-label="إرسال"
      >
        <span className={`ms${isSending ? ' spin' : ''}`} aria-hidden="true">
          {isSending ? 'progress_activity' : 'send'}
        </span>
      </button>
    </form>
  )
}
