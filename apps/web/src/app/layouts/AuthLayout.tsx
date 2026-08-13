import { Outlet } from 'react-router'
import type { PropsWithChildren } from 'react'
import { TeacherPoster } from '../../features/auth/components/TeacherPoster'

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
        <TeacherPoster />
      </aside>
    </div>
  )
}
