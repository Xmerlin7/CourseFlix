import { useId, useState, type InputHTMLAttributes } from 'react'

type NativeInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'id' | 'value' | 'onChange' | 'className'
>

interface AuthFieldProps extends NativeInputProps {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  /** Material Symbols name drawn in the field's leading gutter. */
  icon: string
  error?: string | null
  hint?: string
}

/**
 * The one text input the auth screens use.
 *
 * Errors are wired through `aria-describedby` + `aria-invalid` rather than
 * being left as loose red text near the field: on these screens the error
 * is frequently the only feedback a user gets, so it has to reach screen
 * readers as part of the input, not as unrelated prose after it.
 */
export function AuthField({
  id,
  label,
  value,
  onChange,
  icon,
  error,
  hint,
  ...inputProps
}: AuthFieldProps) {
  const describedBy = useId()
  // The hint is replaced by the error rather than stacked under it, so the
  // id must only be advertised while the hint is actually on the page —
  // aria-describedby pointing at a removed node is silently dropped by
  // some screen readers and read as empty by others.
  const errorId = error ? `${describedBy}-error` : undefined
  const hintId = hint && !error ? `${describedBy}-hint` : undefined

  return (
    <div className={`cfa-field${error ? ' invalid' : ''}`}>
      <label className="cfa-label" htmlFor={id}>
        {label}
      </label>

      <div className="cfa-input-wrap">
        <input
          {...inputProps}
          id={id}
          className="cfa-input"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={[errorId, hintId].filter(Boolean).join(' ') || undefined}
        />
        {/* After the input in the DOM so `.cfa-input:focus ~ .cfa-input-icon`
            can tint it on focus — a sibling combinator only looks forward. */}
        <span className="cfa-input-icon ms" aria-hidden="true">
          {icon}
        </span>
      </div>

      {hint && !error && (
        <span className="cfa-hint" id={hintId}>
          {hint}
        </span>
      )}

      {error && (
        <span className="cfa-error" id={errorId} role="alert">
          <span className="ms" aria-hidden="true">
            error
          </span>
          {error}
        </span>
      )}
    </div>
  )
}

interface AuthPasswordFieldProps extends NativeInputProps {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  error?: string | null
  hint?: string
  /** Renders the strength meter — register/reset only, never on sign-in. */
  showStrength?: boolean
}

const STRENGTH_LABELS = ['', 'ضعيفة', 'مقبولة', 'جيدة', 'قوية'] as const

/**
 * Rough, deliberately generous strength score (0–4) driving the visual
 * meter only — `validatePasswordPolicy` below is the actual gate.
 */
function scorePassword(password: string): number {
  if (!password) return 0

  let score = 0
  if (password.length >= 8) score += 1
  if (password.length >= 12) score += 1
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1
  if (/\d/.test(password) && /[^A-Za-z0-9]/.test(password)) score += 1

  // A password under the API's own minimum should never show more than one
  // filled segment, however varied its characters are.
  return password.length < 8 ? 1 : Math.max(1, Math.min(4, score))
}

// Mirrors the API's PASSWORD_PATTERN (auth/dto/password-policy.ts) exactly —
// a client-side reject that doesn't match the server's would let a password
// through the wizard only to bounce off a 400 on the last step.
const PASSWORD_POLICY_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/

/**
 * Validates a new password against the same rule the API enforces
 * (register, password reset). Returns an error message, or null when the
 * password is acceptable. Not used for login — that authenticates
 * whatever password already exists, not a new one.
 */
export function validatePasswordPolicy(password: string): string | null {
  if (password.length === 0) {
    return 'كلمة المرور مطلوبة'
  }
  if (password.length < 8) {
    return 'كلمة المرور لازم تكون ٨ أحرف على الأقل'
  }
  if (!PASSWORD_POLICY_PATTERN.test(password)) {
    return 'كلمة المرور لازم تحتوي على حرف كبير وحرف صغير ورقم على الأقل'
  }
  return null
}

export function AuthPasswordField({
  id,
  label,
  value,
  onChange,
  error,
  hint,
  showStrength = false,
  ...inputProps
}: AuthPasswordFieldProps) {
  const [visible, setVisible] = useState(false)
  const describedBy = useId()
  const errorId = error ? `${describedBy}-error` : undefined
  const hintId = hint && !error ? `${describedBy}-hint` : undefined
  const score = showStrength ? scorePassword(value) : 0

  return (
    <div className={`cfa-field${error ? ' invalid' : ''}`}>
      <label className="cfa-label" htmlFor={id}>
        {label}
      </label>

      <div className="cfa-input-wrap">
        <input
          {...inputProps}
          type={visible ? 'text' : 'password'}
          id={id}
          className="cfa-input has-action"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={[errorId, hintId].filter(Boolean).join(' ') || undefined}
        />
        <span className="cfa-input-icon ms" aria-hidden="true">
          lock
        </span>
        <button
          type="button"
          className="cfa-input-action"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
        >
          <span className="ms sm" aria-hidden="true">
            {visible ? 'visibility_off' : 'visibility'}
          </span>
        </button>
      </div>

      {showStrength && value.length > 0 && (
        <div className="cfa-strength" data-score={score}>
          <div className="cfa-strength-track" aria-hidden="true">
            <i />
            <i />
            <i />
            <i />
          </div>
          <span className="cfa-strength-label">{STRENGTH_LABELS[score]}</span>
        </div>
      )}

      {hint && !error && (
        <span className="cfa-hint" id={hintId}>
          {hint}
        </span>
      )}

      {error && (
        <span className="cfa-error" id={errorId} role="alert">
          <span className="ms" aria-hidden="true">
            error
          </span>
          {error}
        </span>
      )}
    </div>
  )
}
