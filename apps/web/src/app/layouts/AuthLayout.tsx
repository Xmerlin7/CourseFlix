import { Outlet } from 'react-router'
import { useRef, type PointerEvent, type PropsWithChildren } from 'react'
import { AuthMeshCanvas } from '../../features/auth/components/AuthMeshCanvas'
import { AuthCourseStrip } from '../../features/auth/components/TeacherPoster'
import { useAuthPoster } from '../../features/auth/hooks/useAuthPoster'

// Immersive auth shell shared by /login and /register. The form remains
// first in the DOM and keeps the existing auth flow; the course visuals
// around it are decorative, with a compact admin-selected course strip.
export function AuthLayout({ children }: PropsWithChildren) {
  const poster = useAuthPoster()
  const shellRef = useRef<HTMLDivElement | null>(null)

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    const shell = shellRef.current
    if (!shell) return

    const rect = shell.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    const normalizedX = x / Math.max(1, rect.width) - 0.5
    const normalizedY = y / Math.max(1, rect.height) - 0.5

    shell.style.setProperty('--auth-pointer-x', `${x}px`)
    shell.style.setProperty('--auth-pointer-y', `${y}px`)
    shell.style.setProperty('--auth-pointer-px', `${Math.min(100, Math.max(0, (x / Math.max(1, rect.width)) * 100)).toFixed(2)}%`)
    shell.style.setProperty('--auth-pointer-py', `${Math.min(100, Math.max(0, (y / Math.max(1, rect.height)) * 100)).toFixed(2)}%`)
    shell.style.setProperty('--auth-pointer-nx', normalizedX.toFixed(4))
    shell.style.setProperty('--auth-pointer-ny', normalizedY.toFixed(4))
    shell.dataset.pointer = 'active'
  }

  function handlePointerLeave() {
    const shell = shellRef.current
    if (!shell) return

    shell.style.setProperty('--auth-pointer-x', '50%')
    shell.style.setProperty('--auth-pointer-y', '50%')
    shell.style.setProperty('--auth-pointer-px', '50%')
    shell.style.setProperty('--auth-pointer-py', '50%')
    shell.style.setProperty('--auth-pointer-nx', '0')
    shell.style.setProperty('--auth-pointer-ny', '0')
    shell.dataset.pointer = 'idle'
  }

  return (
    <div
      ref={shellRef}
      className="auth-shell"
      data-pointer="idle"
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      <AuthMeshCanvas />
      <div className="auth-grid" aria-hidden="true" />
      <div className="auth-pointer-aura" aria-hidden="true" />

      <main className="auth-panel-form">
        <div className="auth-form-inner">
          <span className="logo auth-form-logo">COURSEFLIX</span>
          <AuthCourseStrip content={poster.data} />

          {children ?? <Outlet />}

          <p className="foot">جميع الحقوق محفوظة لمنصة CourseFlix · 2026</p>
        </div>
      </main>

    </div>
  )
}
