import { useState } from 'react'
import type { PropsWithChildren } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router'
import { useAuth } from '../../features/auth/hooks/useAuth'
import { useUnreadNotificationsCount } from '../../features/notifications/hooks/useUnreadNotificationsCount'
import { Sidebar } from '../../shared/components/Sidebar'
import { Topbar } from '../../shared/components/Topbar'
import { useSidebarCollapsed } from '../../shared/hooks/useSidebarCollapsed'
import { useSidebarPosition } from '../../shared/hooks/useSidebarPosition'
import { ROUTE_PATHS } from '../routes/route-paths'

// No FloatingAssistant here — the AI course tutor doesn't have a role to
// play in an admin operator's workflow.
export function AdminLayout({ children }: PropsWithChildren) {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const { isCollapsed: isRail, setCollapsed: setIsRail } = useSidebarCollapsed()
  const { position: sidebarPosition } = useSidebarPosition()
  // Phone nav drawer. Separate from `isRail` (the desktop collapse) —
  // they're different controls on different breakpoints, and sharing one
  // flag meant collapsing on desktop also armed the phone drawer.
  const [isNavOpen, setIsNavOpen] = useState(false)
  const unreadCount = useUnreadNotificationsCount()

  async function handleLogout() {
    await logout()
    navigate(ROUTE_PATHS.LOGIN, { replace: true })
  }

  return (
    <div className="app" data-sidebar-pos={sidebarPosition}>
      <Sidebar
        role="admin"
        userName={user?.fullName ?? ''}
        avatarUrl={user?.avatarUrl}
        activePath={location.pathname}
        onLogout={() => void handleLogout()}
        isRail={isRail}
        onToggleRail={() => setIsRail(!isRail)}
        isMobileOpen={isNavOpen}
        onCloseMobile={() => setIsNavOpen(false)}
        profilePath={ROUTE_PATHS.ADMIN.PROFILE}
      />

      <div className="main">
        <div className="sheet">
          <Topbar
            onMenuClick={() => setIsNavOpen(true)}
            notificationCount={unreadCount}
            notificationsPath={ROUTE_PATHS.ADMIN.NOTIFICATIONS}
            onSettingsClick={() => navigate(ROUTE_PATHS.ADMIN.SETTINGS)}
            onLogoClick={() => navigate(ROUTE_PATHS.ADMIN.DASHBOARD)}
          />

          <div className="page">{children ?? <Outlet />}</div>
        </div>
      </div>
    </div>
  )
}
