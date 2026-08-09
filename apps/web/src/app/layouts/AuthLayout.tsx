import { Outlet } from 'react-router'
import type { PropsWithChildren } from 'react'

const FEATURES = [
  { icon: 'smart_toy', text: 'مساعد ذكي يجاوب على أسئلتك في أي وقت' },
  { icon: 'quiz', text: 'اختبارات فورية بعد كل درس لتثبيت المعلومة' },
  { icon: 'monitoring', text: 'متابعة حضورك وتقدمك الدراسي لحظة بلحظة' },
  { icon: 'verified_user', text: 'محتوى محمي بعلامة مائية خاصة بحسابك' },
]

// Split-screen shell shared by /login and /register: a compact form
// column plus a branded panel, instead of one small card floating in an
// otherwise empty viewport. The brand panel is purely decorative (nav
// order in the DOM puts the form first, right-aligned in RTL) so it's
// aria-hidden — the actual page content is the form.
export function AuthLayout({ children }: PropsWithChildren) {
  return (
    <div className="auth-shell">
      <main className="auth-panel-form">
        <div className="auth-form-inner">
          <span className="logo auth-form-logo">COURSEFLIX</span>

          {children ?? <Outlet />}

          <p className="foot">جميع الحقوق محفوظة لمنصة CourseFlix · 2026</p>
        </div>
      </main>

      <aside className="auth-panel-brand" aria-hidden="true">
        <span className="auth-brand-blob blob-1" />
        <span className="auth-brand-blob blob-2" />
        <div className="auth-brand-content">
          <span className="logo auth-brand-logo">COURSEFLIX</span>
          <p className="auth-brand-tag">منصة الفيزياء للمرحلتين الإعدادية والثانوية</p>
          <ul className="auth-feature-list">
            {FEATURES.map((feature) => (
              <li key={feature.text}>
                <span className="ms">{feature.icon}</span>
                {feature.text}
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  )
}
