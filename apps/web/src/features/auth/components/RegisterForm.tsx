import { Fragment, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { ApiError } from '../../../shared/api/api-error'
import { ROUTE_PATHS } from '../../../app/routes/route-paths'
import { AuthField, AuthPasswordField } from './AuthField'
import { AuthAlert, AuthSubmit } from './AuthUi'
import { requestOtp } from '../api/auth.api'
import { useAuth } from '../hooks/useAuth'
import { getRoleHomePath } from '../utils/get-role-home-path'
import { VerifyCodeForm } from './VerifyCodeForm'

const STEPS = ['البيانات الأساسية', 'كلمة المرور', 'الشروط والأحكام'] as const

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type FieldName = 'fullName' | 'email' | 'password' | 'confirmPassword'

interface PendingRegistration {
  email: string
  devCode?: string
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
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FieldName, string>>>({})
  const [stepError, setStepError] = useState<string | null>(null)
  const [pendingRegistration, setPendingRegistration] = useState<PendingRegistration | null>(null)
  // Set when a 409 says the email is already registered — the account may
  // exist but be unverified (pending), so offer re-sending the verification
  // code instead of making the user abandon the email.
  const [resumeEmail, setResumeEmail] = useState<string | null>(null)

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
      // No session yet — the account is created inactive and a verification
      // code is emailed. The code step below activates + signs the user in.
      const response = await register({ fullName, email, password, acceptedTerms: true })
      setPendingRegistration({ email: response.email, devCode: response.devCode })
    } catch (caughtError) {
      if (caughtError instanceof ApiError && caughtError.status === 409) {
        // Email is taken. It might be their own earlier registration that was
        // never verified — route them to re-send the verification code.
        setResumeEmail(email.trim())
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

  const verificationEmail = pendingRegistration?.email ?? resumeEmail
  const isResume = resumeEmail !== null

  if (verificationEmail) {
    return (
      <>
        <p className="cfa-sent-to">
          <span className="ms" aria-hidden="true">
            mark_email_unread
          </span>
          <span>
            {isResume ? (
              <>
                البريد <strong>{verificationEmail}</strong> مسجل بالفعل — إن كنت أنشأت
                الحساب ولم تفعّله بعد، أعد إرسال الرمز وأدخله بالأسفل.
              </>
            ) : (
              <>
                راسلنا رمز تحقق إلى <strong>{verificationEmail}</strong> — اكتبه بالأسفل
                لتفعيل حسابك وتسجيل الدخول.
              </>
            )}
          </span>
        </p>

        <VerifyCodeForm
          email={verificationEmail}
          purpose="register"
          devCode={pendingRegistration?.devCode}
          onResend={(target) => requestOtp({ email: target, purpose: 'register' })}
          onResendResult={(response) => {
            if (isResume && response.accountStatus === 'active') {
              setStepError('هذا البريد مفعّل بالفعل — سجّل الدخول مباشرة بكلمة المرور')
            } else if (isResume && response.accountStatus === 'unknown') {
              setStepError('هذا البريد غير مسجل في المنصة — أنشئ حسابًا جديدًا من البداية')
            }
          }}
          onVerified={(user) => navigate(getRoleHomePath(user.role), { replace: true })}
        />

        {stepError && <AuthAlert>{stepError}</AuthAlert>}

        {isResume && (
          <div className="cfa-row">
            <button
              type="button"
              className="cfa-link-btn"
              onClick={() => {
                setResumeEmail(null)
                setStep(0)
              }}
            >
              <span className="ms" aria-hidden="true">
                arrow_forward
              </span>
              استخدم بريدًا آخر
            </button>
          </div>
        )}
      </>
    )
  }

  return (
    <form onSubmit={(event) => void handleSubmit(event)} noValidate>
      <div className="cfa-steps" role="group" aria-label="خطوات إنشاء الحساب">
        {STEPS.map((label, index) => (
          <Fragment key={label}>
            {index > 0 && (
              <span
                className={`cfa-step-line${index <= step ? ' done' : ''}`}
                aria-hidden="true"
              />
            )}
            <div
              className={`cfa-step${index === step ? ' current' : ''}${index < step ? ' done' : ''}`}
              aria-current={index === step ? 'step' : undefined}
            >
              <span className="cfa-step-dot">
                {index < step ? (
                  <span className="ms" aria-hidden="true">
                    check
                  </span>
                ) : (
                  index + 1
                )}
              </span>
              <span className="cfa-step-label">{label}</span>
            </div>
          </Fragment>
        ))}
      </div>

      {step === 0 && (
        <div className="cfa-pane">
          <AuthField
            id="fullName"
            label="الاسم الكامل"
            icon="person"
            type="text"
            placeholder="أحمد محمد"
            autoComplete="name"
            autoFocus
            value={fullName}
            onChange={setFullName}
            error={fieldErrors.fullName}
          />

          <AuthField
            id="email"
            label="البريد الإلكتروني"
            icon="mail"
            type="email"
            inputMode="email"
            placeholder="name@example.com"
            autoComplete="email"
            dir="ltr"
            value={email}
            onChange={setEmail}
            error={fieldErrors.email}
          />
        </div>
      )}

      {step === 1 && (
        <div className="cfa-pane">
          <AuthPasswordField
            id="password"
            label="كلمة المرور"
            placeholder="٨ أحرف على الأقل"
            autoComplete="new-password"
            autoFocus
            showStrength
            value={password}
            onChange={setPassword}
            error={fieldErrors.password}
          />

          <AuthPasswordField
            id="confirmPassword"
            label="تأكيد كلمة المرور"
            placeholder="٨ أحرف على الأقل"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            error={fieldErrors.confirmPassword}
          />
        </div>
      )}

      {step === 2 && (
        <div className="cfa-pane">
          <p className="cfa-subtitle">لازم تقرأ وتوافق على الاثنين عشان تقدر تكمل</p>

          <div className="cfa-consent">
            <div className="cfa-consent-row">
              <label className={`cfa-check${acceptedTerms ? ' checked' : ''}`}>
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(event) => setAcceptedTerms(event.target.checked)}
                />
                وافقت على الشروط والأحكام
              </label>
              <Link
                to={ROUTE_PATHS.TERMS}
                target="_blank"
                rel="noopener noreferrer"
                className="cfa-read"
              >
                <span className="ms" aria-hidden="true">
                  open_in_new
                </span>
                قراءة
              </Link>
            </div>

            <div className="cfa-consent-row">
              <label className={`cfa-check${acceptedPrivacy ? ' checked' : ''}`}>
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
                className="cfa-read"
              >
                <span className="ms" aria-hidden="true">
                  open_in_new
                </span>
                قراءة
              </Link>
            </div>
          </div>
        </div>
      )}

      {stepError && <AuthAlert>{stepError}</AuthAlert>}

      {/* One actions row for every step — the submit button is `flex: 1`, so
          it simply fills the row on step 0 where there is nothing to go back
          to. */}
      <div className="cfa-actions">
        {step > 0 && (
          <button type="button" className="cfa-btn ghost" onClick={goBack}>
            <span className="ms" aria-hidden="true">
              arrow_forward
            </span>
            السابق
          </button>
        )}

        <AuthSubmit
          icon={isLastStep ? 'person_add' : 'arrow_back'}
          isPending={isSubmitting}
          pendingLabel="جارٍ إنشاء الحساب..."
          disabled={isLastStep && (!acceptedTerms || !acceptedPrivacy)}
        >
          {isLastStep ? 'إنشاء حساب' : 'التالي'}
        </AuthSubmit>
      </div>
    </form>
  )
}
