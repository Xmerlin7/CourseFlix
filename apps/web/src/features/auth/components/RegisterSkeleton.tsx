import { Fragment } from 'react'
import '../../../shared/components/Skeleton.css'

const STEPS = ['البيانات الأساسية', 'كلمة المرور', 'الشروط والأحكام'] as const

/**
 * Mirrors RegisterForm's first step: the real stepper (its 3 labels are
 * static, not fetched data, so they render for real instead of as gray
 * bars) plus the "البيانات الأساسية" step's two fields and the
 * continue button.
 */
export function RegisterSkeleton() {
  return (
    <div className="skeleton-pulse" role="status" aria-label="جاري تحميل المحتوى" data-testid="register-skeleton">
      <div className="stepper" aria-label="خطوات إنشاء الحساب">
        <div className="stepper-track">
          {STEPS.map((label, index) => (
            <Fragment key={label}>
              {index > 0 && <span className="stepper-line" aria-hidden="true" />}
              <span className={`stepper-circle${index === 0 ? ' current' : ''}`}>{index + 1}</span>
            </Fragment>
          ))}
        </div>
        <div className="stepper-labels">
          {STEPS.map((label, index) => (
            <span key={label} className={`stepper-label${index === 0 ? ' current' : ''}`}>
              {label}
            </span>
          ))}
        </div>
      </div>

      <div className="wizard-step">
        <div className="tf">
          <div className="skeleton" style={{ height: 13, width: 100, borderRadius: 6, marginBottom: 7 }} />
          <div className="skeleton" style={{ height: 46, width: '100%', borderRadius: 14 }} />
        </div>

        <div className="tf">
          <div className="skeleton" style={{ height: 13, width: 120, borderRadius: 6, marginBottom: 7 }} />
          <div className="skeleton" style={{ height: 46, width: '100%', borderRadius: 14 }} />
        </div>
      </div>

      <div className="wizard-actions">
        <div className="skeleton" style={{ height: 48, width: '100%', borderRadius: 999 }} />
      </div>

      <div className="auth-switch">
        <div className="skeleton" style={{ height: 14, width: 220, borderRadius: 6, margin: '0 auto' }} />
      </div>

      <span className="skeleton-sr-only">جاري تحميل المحتوى</span>
    </div>
  )
}
