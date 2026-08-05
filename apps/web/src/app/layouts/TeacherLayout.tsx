import { useState } from 'react'
import type { PropsWithChildren } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router'
import { useAuth } from '../../features/auth/hooks/useAuth'
import { useUnreadNotificationsCount } from '../../features/notifications/hooks/useUnreadNotificationsCount'
import { Sidebar } from '../../shared/components/Sidebar'
import { Topbar } from '../../shared/components/Topbar'
import { ROUTE_PATHS } from '../routes/route-paths'

export function TeacherLayout({ children }: PropsWithChildren) {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [isRail, setIsRail] = useState(false)
  const unreadCount = useUnreadNotificationsCount()

  async function handleLogout() {
    await logout()
    navigate(ROUTE_PATHS.LOGIN, { replace: true })
  }

  return (
    <div className="app">
      <Sidebar
        role="teacher"
        userName={user?.fullName ?? ''}
        activePath={location.pathname}
        onLogout={() => void handleLogout()}
        isRail={isRail}
        onToggleRail={() => setIsRail((prev) => !prev)}
      />

      <div className="main">
        <div className="sheet">
          <Topbar
            notificationCount={unreadCount}
            notificationsPath={ROUTE_PATHS.TEACHER.NOTIFICATIONS}
            onSettingsClick={() => {}}
            onLogoClick={() => navigate(ROUTE_PATHS.TEACHER.DASHBOARD)}
          />

          <div className="page">{children ?? <Outlet />}</div>
        </div>
      </div>
    </div>
  )
}
