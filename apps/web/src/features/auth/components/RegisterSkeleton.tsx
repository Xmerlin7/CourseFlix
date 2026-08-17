import { Fragment } from 'react'
import '../../../shared/components/Skeleton.css'

const STEPS = ['البيانات الأساسية', 'كلمة المرور', 'الشروط والأحكام'] as const

/**
 * Suspense fallback for /register. The stepper's three labels are static
 * strings, not fetched data, so they render for real rather than as grey
 * bars — only the fields below them are unknown at this point.
 */
export function RegisterSkeleton() {
  return (
    <div
      className="skeleton-pulse"
      role="status"
      aria-label="جاري تحميل المحتوى"
      data-testid="register-skeleton"
    >
      <div className="cfa-head">
        <div className="skeleton" style={{ height: 30, width: 160, borderRadius: 8, marginBottom: 10 }} />
        <div className="skeleton" style={{ height: 15, width: 270, borderRadius: 6 }} />
      </div>

      <div className="cfa-steps" aria-hidden="true">
        {STEPS.map((label, index) => (
          <Fragment key={label}>
            {index > 0 && <span className="cfa-step-line" />}
            <div className={`cfa-step${index === 0 ? ' current' : ''}`}>
              <span className="cfa-step-dot">{index + 1}</span>
              <span className="cfa-step-label">{label}</span>
            </div>
          </Fragment>
        ))}
      </div>

      <div className="cfa-pane">
        {[0, 1].map((index) => (
          <div className="cfa-field" key={index}>
            <div className="skeleton" style={{ height: 13, width: 110, borderRadius: 6 }} />
            <div className="skeleton" style={{ height: 48, width: '100%', borderRadius: 14 }} />
          </div>
        ))}
      </div>

      <div className="cfa-actions">
        <div className="skeleton" style={{ height: 50, width: '100%', borderRadius: 14 }} />
      </div>

      <div className="skeleton" style={{ height: 14, width: 130, borderRadius: 6, margin: '24px auto 18px' }} />

      <div className="cfa-social">
        <div className="skeleton" style={{ height: 46, width: '100%', borderRadius: 14 }} />
        <div className="skeleton" style={{ height: 46, width: '100%', borderRadius: 14 }} />
      </div>

      <span className="skeleton-sr-only">جاري تحميل المحتوى</span>
    </div>
  )
}
