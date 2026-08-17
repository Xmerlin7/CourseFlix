import type { ReactNode } from 'react'

interface AuthSubmitProps {
  /** Label shown at rest. */
  children: ReactNode
  /** Label shown while the request is in flight. */
  pendingLabel: string
  isPending: boolean
  icon?: string
  disabled?: boolean
}

/**
 * Primary submit button for every auth form.
 *
 * The pending state swaps the icon for a spinner *and* the label for
 * `pendingLabel`, and keeps the button disabled while in flight — a second
 * click on a login or register form is not a harmless repeat, it is a
 * duplicate account or a wasted rate-limit slot.
 */
export function AuthSubmit({
  children,
  pendingLabel,
  isPending,
  icon,
  disabled,
}: AuthSubmitProps) {
  return (
    <button
      type="submit"
      className="cfa-btn cfa-submit"
      disabled={isPending || disabled}
      aria-busy={isPending || undefined}
    >
      {isPending ? (
        <span className="cfa-spinner" aria-hidden="true" />
      ) : (
        icon && (
          <span className="ms" aria-hidden="true">
            {icon}
          </span>
        )
      )}
      {isPending ? pendingLabel : children}
    </button>
  )
}

interface AuthAlertProps {
  children: ReactNode
  tone?: 'error' | 'info' | 'success'
}

/**
 * Form-level message — a failed submit, an OAuth bounce-back, a completed
 * password reset. `role` follows the tone: only errors interrupt a screen
 * reader mid-sentence, the rest are announced politely.
 */
export function AuthAlert({ children, tone = 'error' }: AuthAlertProps) {
  const icon = tone === 'success' ? 'check_circle' : tone === 'info' ? 'info' : 'error'

  return (
    <p
      className={`cfa-alert${tone === 'error' ? '' : ` ${tone}`}`}
      role={tone === 'error' ? 'alert' : 'status'}
    >
      <span className="ms" aria-hidden="true">
        {icon}
      </span>
      <span>{children}</span>
    </p>
  )
}
