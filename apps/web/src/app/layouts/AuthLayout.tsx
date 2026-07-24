import { Outlet } from 'react-router'
import type { PropsWithChildren } from 'react'

export function AuthLayout({ children }: PropsWithChildren) {
  return (
    <div className="login-screen">
      <div className="login-wrap">
        <div className="login-card">
          <div className="logo">COURSEFLIX</div>
          <p className="tag">منصة الفيزياء للمرحلتين الإعدادية والثانوية</p>
          {children ? <>{children}</> : <Outlet />}
        </div>
        <p className="foot">جميع الحقوق محفوظة لمنصة CourseFlix · 2026</p>
      </div>
    </div>
  )
}