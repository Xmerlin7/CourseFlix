import { Fragment, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { ApiError } from '../../../shared/api/api-error'
import { useAuth } from '../hooks/useAuth'
import { getRoleHomePath } from '../utils/get-role-home-path'
import { LEGAL_LAST_UPDATED, PRIVACY_SECTIONS, TERMS_SECTIONS, type LegalSection } from '../lib/legal-content'

const STEPS = ['البيانات الأساسية', 'كلمة المرور', 'الشروط والأحكام'] as const

function LegalDocument({ title, sections }: { title: string; sections: LegalSection[] }) {
  return (
    <div className="legal-doc">
      <h4>{title}</h4>
      {sections.map((section) => (
        <div key={section.heading} className="legal-section">
          <p className="legal-heading">{section.heading}</p>
          <p className="legal-body">{section.body}</p>
        </div>
      ))}
      <p className="legal-updated">آخر تحديث: {LEGAL_LAST_UPDATED}</p>
    </div>
  )
}

export function RegisterForm() {
  const { register } = useAuth()
  const navigate = useNavigate()

  const [step, setStep] = useState(0)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [stepError, setStepError] = useState<string | null>(null)
  const [serverError, setServerError] = useState<string | null>(null)

  const isLastStep = step === STEPS.length - 1

  function validateStep(current: number): string | null {
    if (current === 0) {
      if (fullName.trim().length < 3) return 'الاسم لازم يكون ٣ أحرف على الأقل'
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'البريد الإلكتروني مش صحيح'
    }
    if (current === 1) {
      if (password.length < 8) return 'كلمة المرور لازم تكون ٨ أحرف على الأقل'
      if (password !== confirmPassword) return 'كلمتا المرور مش متطابقتين'
    }
    return null
  }

  function goBack() {
    setStepError(null)
    setStep((s) => Math.max(0, s - 1))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!isLastStep) {
      const validationError = validateStep(step)
      if (validationError) {
        setStepError(validationError)
        return
      }
      setStepError(null)
      setStep((s) => Math.min(STEPS.length - 1, s + 1))
      return
    }

    if (!acceptedTerms || !acceptedPrivacy) {
      setStepError('لازم توافق على الشروط والأحكام وسياسة الخصوصية عشان تكمل')
      return
    }

    setStepError(null)
    setServerError(null)
    setIsSubmitting(true)
    try {
      const user = await register({ fullName, email, password, acceptedTerms: true })
      navigate(getRoleHomePath(user.role), { replace: true })
    } catch (caughtError) {
      if (caughtError instanceof ApiError && caughtError.status === 409) {
        setServerError('البريد الإلكتروني مستخدم بالفعل')
      } else if (caughtError instanceof ApiError && caughtError.status === 400) {
        setServerError('البيانات غير صحيحة، راجع الحقول من فضلك')
      } else {
        setServerError('حدث خطأ ما، حاول مرة أخرى')
      }
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={(event) => void handleSubmit(event)} noValidate className="register-wizard">
      <div className="stepper" aria-label="خطوات إنشاء الحساب">
        <div className="stepper-track">
          {STEPS.map((label, index) => (
            <Fragment key={label}>
              {index > 0 && <span className={`stepper-line${index <= step ? ' done' : ''}`} aria-hidden="true" />}
              <span
                className={`stepper-circle${index === step ? ' current' : ''}${index < step ? ' done' : ''}`}
                aria-current={index === step ? 'step' : undefined}
              >
                {index < step ? <span className="ms sm">check</span> : index + 1}
              </span>
            </Fragment>
          ))}
        </div>
        <div className="stepper-labels">
          {STEPS.map((label, index) => (
            <span key={label} className={`stepper-label${index === step ? ' current' : ''}`}>
              {label}
            </span>
          ))}
        </div>
      </div>

      {step === 0 && (
        <div className="wizard-step">
          <div className="tf">
            <label htmlFor="fullName">الاسم الكامل</label>
            <input
              type="text"
              id="fullName"
              placeholder="أحمد محمد"
              autoComplete="name"
              autoFocus
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
            />
          </div>

          <div className="tf">
            <label htmlFor="email">البريد الإلكتروني</label>
            <input
              type="email"
              id="email"
              placeholder="name@example.com"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="wizard-step">
          <div className="tf">
            <label htmlFor="password">كلمة المرور</label>
            <input
              type="password"
              id="password"
              placeholder="********"
              autoComplete="new-password"
              autoFocus
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>

          <div className="tf">
            <label htmlFor="confirmPassword">تأكيد كلمة المرور</label>
            <input
              type="password"
              id="confirmPassword"
              placeholder="********"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
            />
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="wizard-step">
          <LegalDocument title="الشروط والأحكام" sections={TERMS_SECTIONS} />
          <label className={`legal-check${acceptedTerms ? ' checked' : ''}`}>
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={(event) => setAcceptedTerms(event.target.checked)}
            />
            قرأت ووافقت على الشروط والأحكام
          </label>

          <LegalDocument title="سياسة الخصوصية" sections={PRIVACY_SECTIONS} />
          <label className={`legal-check${acceptedPrivacy ? ' checked' : ''}`}>
            <input
              type="checkbox"
              checked={acceptedPrivacy}
              onChange={(event) => setAcceptedPrivacy(event.target.checked)}
            />
            قرأت ووافقت على سياسة الخصوصية
          </label>
        </div>
      )}

      {stepError && (
        <span className="error-text" role="alert">
          {stepError}
        </span>
      )}
      {serverError && (
        <span className="error-text" role="alert">
          {serverError}
        </span>
      )}

      <div className="wizard-actions">
        {step > 0 && (
          <button type="button" className="btn outline" onClick={goBack}>
            <span className="ms">arrow_forward</span>
            السابق
          </button>
        )}
        <button
          type="submit"
          className="btn big"
          disabled={isSubmitting || (isLastStep && (!acceptedTerms || !acceptedPrivacy))}
          style={step === 0 ? { width: '100%' } : undefined}
        >
          {isLastStep ? (
            <>
              <span className="ms">person_add</span>
              {isSubmitting ? 'جارٍ إنشاء الحساب...' : 'إنشاء حساب'}
            </>
          ) : (
            <>
              التالي
              <span className="ms">arrow_back</span>
            </>
          )}
        </button>
      </div>
    </form>
  )
}
