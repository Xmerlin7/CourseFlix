import { useState } from 'react'
import type { PropsWithChildren } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router'
import { useAuth } from '../../features/auth/hooks/useAuth'
import { useUnreadNotificationsCount } from '../../features/notifications/hooks/useUnreadNotificationsCount'
import { Sidebar } from '../../shared/components/Sidebar'
import { FloatingAssistant } from '../../shared/components/FloatingAssistant'
import { Topbar } from '../../shared/components/Topbar'
import { useSidebarCollapsed } from '../../shared/hooks/useSidebarCollapsed'
import { usePendingActionCount } from '../../features/assistant-actions/hooks/usePendingActionCount'
import { ROUTE_PATHS } from '../routes/route-paths'

export function TeacherLayout({ children }: PropsWithChildren) {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const { isCollapsed: isRail, setCollapsed: setIsRail } = useSidebarCollapsed()
  // Phone nav drawer. Separate from `isRail` (the desktop collapse) —
  // they're different controls on different breakpoints, and sharing one
  // flag meant collapsing on desktop also armed the phone drawer.
  const [isNavOpen, setIsNavOpen] = useState(false)
  // Assistants don't review anything, so they don't poll for a count.
  const pendingActionCount = usePendingActionCount(user?.role === 'teacher')
  const unreadCount = useUnreadNotificationsCount()

  async function handleLogout() {
    await logout()
    navigate(ROUTE_PATHS.LOGIN, { replace: true })
  }

  const isAssistant = user?.role === 'assistant'

  return (
    <div className="app">
      <Sidebar
        role={isAssistant ? 'assistant' : 'teacher'}
        userName={user?.fullName ?? ''}
        avatarUrl={user?.avatarUrl}
        activePath={location.pathname}
        onLogout={() => void handleLogout()}
        isRail={isRail}
        onToggleRail={() => setIsRail(!isRail)}
        isMobileOpen={isNavOpen}
        onCloseMobile={() => setIsNavOpen(false)}
        profilePath={ROUTE_PATHS.TEACHER.PROFILE}
        pendingActionCount={pendingActionCount}
      />

      <div className="main">
        <div className="sheet">
          <Topbar
            onMenuClick={() => setIsNavOpen(true)}
            notificationCount={unreadCount}
            notificationsPath={ROUTE_PATHS.TEACHER.NOTIFICATIONS}
            onSettingsClick={() => navigate(ROUTE_PATHS.TEACHER.SETTINGS)}
            onLogoClick={() => navigate(ROUTE_PATHS.TEACHER.DASHBOARD)}
          />

          <div className="page">{children ?? <Outlet />}</div>
        </div>
      </div>

      {/* The analytics assistant queries teacher-only sales/analytics
          data the API blocks assistants from — same reasoning as
          AdminLayout omitting this entirely. */}
      {!isAssistant && <FloatingAssistant role="teacher" />}
    </div>
  )
}
