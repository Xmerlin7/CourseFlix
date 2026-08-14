import { type FormEvent, type KeyboardEvent } from 'react'

export interface DiscussionReplyComposerProps {
  value: string
  onChange: (value: string) => void
  onSubmit: () => Promise<void> | void
  isSubmitting?: boolean
  placeholder?: string
}

export function DiscussionReplyComposer({
  value,
  onChange,
  onSubmit,
  isSubmitting = false,
  placeholder = 'اكتب توضيحك أو إجابتك هنا... (اضغط Enter للإرسال)',
}: DiscussionReplyComposerProps) {
  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!value.trim() || isSubmitting) return
    void onSubmit()
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      if (value.trim() && !isSubmitting) {
        const form = event.currentTarget.form
        if (form) form.requestSubmit()
      }
    }
  }

  return (
    <form onSubmit={handleSubmit} className="discussion-reply-composer" style={{ marginTop: 12 }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, width: '100%' }}>
        <div className="tf" style={{ flex: 1, marginBottom: 0 }}>
          <textarea
            id="reply-body"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            rows={2}
            maxLength={10000}
            disabled={isSubmitting}
            required
          />
        </div>
        <button
          type="submit"
          className="btn primary"
          style={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            flexShrink: 0,
            display: 'grid',
            placeItems: 'center',
            padding: 0,
            marginBottom: 2,
          }}
          disabled={isSubmitting || !value.trim()}
          aria-label="إرسال الرد"
          title="إرسال الرد"
        >
          {isSubmitting ? (
            <span className="ms spin" aria-hidden="true">progress_activity</span>
          ) : (
            <span className="ms" style={{ transform: 'scaleX(-1)', fontSize: 20 }} aria-hidden="true">
              send
            </span>
          )}
        </button>
      </div>
    </form>
  )
}
