import { useState } from 'react'

interface PasswordFieldProps {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  autoComplete?: string
  autoFocus?: boolean
  minLength?: number
  invalid?: boolean
  error?: string | null
}

// Shared password input for login/register: same `.tf` field markup as every
// other text field, plus a show/hide toggle so users can check what they
// typed before submitting.
export function PasswordField({
  id,
  label,
  value,
  onChange,
  placeholder,
  autoComplete,
  autoFocus,
  minLength,
  invalid,
  error,
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false)

  return (
    <div className={`tf${invalid ? ' invalid' : ''}`}>
      <label htmlFor={id}>{label}</label>
      <div className="password-field">
        <input
          type={visible ? 'text' : 'password'}
          id={id}
          placeholder={placeholder}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          minLength={minLength}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
        <button
          type="button"
          className="password-toggle"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
        >
          <span className="ms sm">{visible ? 'visibility_off' : 'visibility'}</span>
        </button>
      </div>
      {error && (
        <span className="error-text" role="alert">
          {error}
        </span>
      )}
    </div>
  )
}
