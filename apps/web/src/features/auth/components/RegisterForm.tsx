import { Fragment, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { ApiError } from '../../../shared/api/api-error'
import { ROUTE_PATHS } from '../../../app/routes/route-paths'
import { useAuth } from '../hooks/useAuth'
import { getRoleHomePath } from '../utils/get-role-home-path'

const STEPS = ['البيانات الأساسية', 'كلمة المرور', 'الشروط والأحكام'] as const

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type FieldName = 'fullName' | 'email' | 'password' | 'confirmPassword'

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
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FieldName, string>>>({})
  const [stepError, setStepError] = useState<string | null>(null)

  const isLastStep = step === STEPS.length - 1

  function validateStep(current: number): boolean {
    const errors: Partial<Record<FieldName, string>> = {}

    if (current === 0) {
      if (fullName.trim().length === 0) {
        errors.fullName = 'الاسم مطلوب'
      } else if (fullName.trim().length < 3) {
        errors.fullName = 'الاسم لازم يكون ٣ أحرف على الأقل'
      }

      if (email.trim().length === 0) {
        errors.email = 'البريد الإلكتروني مطلوب'
      } else if (!EMAIL_PATTERN.test(email.trim())) {
        errors.email = 'البريد الإلكتروني مش صحيح، مثال: name@example.com'
      }
    }

    if (current === 1) {
      if (password.length === 0) {
        errors.password = 'كلمة المرور مطلوبة'
      } else if (password.length < 8) {
        errors.password = 'كلمة المرور لازم تكون ٨ أحرف على الأقل'
      }

      if (confirmPassword.length === 0) {
        errors.confirmPassword = 'أكّد كلمة المرور'
      } else if (password !== confirmPassword) {
        errors.confirmPassword = 'كلمتا المرور مش متطابقتين'
      }
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  function goBack() {
    setStepError(null)
    setStep((s) => Math.max(0, s - 1))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!isLastStep) {
      if (!validateStep(step)) return
      setStepError(null)
      setStep((s) => Math.min(STEPS.length - 1, s + 1))
      return
    }

    if (!acceptedTerms || !acceptedPrivacy) {
      setStepError('لازم توافق على الشروط والأحكام وسياسة الخصوصية عشان تكمل التسجيل')
      return
    }

    setStepError(null)
    setIsSubmitting(true)
    try {
      const user = await register({ fullName, email, password, acceptedTerms: true })
      navigate(getRoleHomePath(user.role), { replace: true })
    } catch (caughtError) {
      if (caughtError instanceof ApiError && caughtError.status === 409) {
        setStep(0)
        setFieldErrors({ email: 'البريد الإلكتروني ده مسجل بالفعل — جرب بريد تاني أو سجّل الدخول' })
      } else if (caughtError instanceof ApiError && caughtError.status === 400) {
        setStep(0)
        setStepError(
          'البيانات اللي بعتها مش صحيحة — تأكد إن الاسم ٣ أحرف على الأقل، البريد الإلكتروني بصيغة صحيحة، وكلمة المرور ٨ أحرف على الأقل',
        )
      } else {
        setStepError('حصل خطأ غير متوقع أثناء إنشاء الحساب، حاول تاني كمان شوية')
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
          <div className={`tf${fieldErrors.fullName ? ' invalid' : ''}`}>
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
            {fieldErrors.fullName && (
              <span className="error-text" role="alert">
                {fieldErrors.fullName}
              </span>
            )}
          </div>

          <div className={`tf${fieldErrors.email ? ' invalid' : ''}`}>
            <label htmlFor="email">البريد الإلكتروني</label>
            <input
              type="email"
              id="email"
              placeholder="name@example.com"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
            {fieldErrors.email && (
              <span className="error-text" role="alert">
                {fieldErrors.email}
              </span>
            )}
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="wizard-step">
          <div className={`tf${fieldErrors.password ? ' invalid' : ''}`}>
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
            {fieldErrors.password && (
              <span className="error-text" role="alert">
                {fieldErrors.password}
              </span>
            )}
          </div>

          <div className={`tf${fieldErrors.confirmPassword ? ' invalid' : ''}`}>
            <label htmlFor="confirmPassword">تأكيد كلمة المرور</label>
            <input
              type="password"
              id="confirmPassword"
              placeholder="********"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
            />
            {fieldErrors.confirmPassword && (
              <span className="error-text" role="alert">
                {fieldErrors.confirmPassword}
              </span>
            )}
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="wizard-step">
          <p className="subtitle" style={{ marginBottom: 0 }}>
            لازم تقرأ وتوافق على الاثنين عشان تقدر تكمل
          </p>

          <div className="legal-accept">
            <div className="legal-accept-row">
              <label className={`legal-check${acceptedTerms ? ' checked' : ''}`}>
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(event) => setAcceptedTerms(event.target.checked)}
                />
                وافقت على الشروط والأحكام
              </label>
              <Link to={ROUTE_PATHS.TERMS} target="_blank" rel="noopener noreferrer" className="btn text btn-compact">
                <span className="ms">open_in_new</span>
                قراءة
              </Link>
            </div>

            <div className="legal-accept-row">
              <label className={`legal-check${acceptedPrivacy ? ' checked' : ''}`}>
                <input
                  type="checkbox"
                  checked={acceptedPrivacy}
                  onChange={(event) => setAcceptedPrivacy(event.target.checked)}
                />
                وافقت على سياسة الخصوصية
              </label>
              <Link
                to={ROUTE_PATHS.PRIVACY}
                target="_blank"
                rel="noopener noreferrer"
                className="btn text btn-compact"
              >
                <span className="ms">open_in_new</span>
                قراءة
              </Link>
            </div>
          </div>
        </div>
      )}

      {stepError && (
        <span className="error-text" role="alert">
          {stepError}
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
