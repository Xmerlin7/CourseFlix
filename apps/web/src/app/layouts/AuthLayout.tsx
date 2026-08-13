import { Outlet } from 'react-router'
import type { PropsWithChildren } from 'react'
import { AuthCourseStrip, TeacherPoster } from '../../features/auth/components/TeacherPoster'
import { useAuthPoster } from '../../features/auth/hooks/useAuthPoster'

// Immersive auth shell shared by /login and /register. The form remains
// first in the DOM and keeps the existing auth flow; the course visuals
// around it are decorative, fed by the admin-selected public poster.
export function AuthLayout({ children }: PropsWithChildren) {
  const poster = useAuthPoster()

  return (
    <div className="auth-shell">
      <div className="auth-mesh" aria-hidden="true" />
      <div className="auth-grid" aria-hidden="true" />

      <main className="auth-panel-form">
        <div className="auth-form-inner">
          <span className="logo auth-form-logo">COURSEFLIX</span>
          <AuthCourseStrip content={poster.data} />

          {children ?? <Outlet />}

          <p className="foot">جميع الحقوق محفوظة لمنصة CourseFlix · 2026</p>
        </div>
      </main>

      <aside className="auth-panel-brand auth-floating-poster" aria-hidden="true">
        <TeacherPoster content={poster.data} isLoading={poster.isLoading} />
      </aside>
    </div>
  )
}
