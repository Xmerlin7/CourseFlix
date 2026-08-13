import type { PropsWithChildren } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router'
import { useAuth } from '../../features/auth/hooks/useAuth'
import { useUnreadNotificationsCount } from '../../features/notifications/hooks/useUnreadNotificationsCount'
import { Sidebar } from '../../shared/components/Sidebar'
import { FloatingAssistant } from '../../shared/components/FloatingAssistant'
import { Topbar } from '../../shared/components/Topbar'
import { useSidebarCollapsed } from '../../shared/hooks/useSidebarCollapsed'
import { useStudentSidebarUnread } from '../../shared/hooks/useStudentSidebarUnread'
import { ROUTE_PATHS } from '../routes/route-paths'

export function StudentLayout({ children }: PropsWithChildren) {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const { isCollapsed: isRail, setCollapsed: setIsRail } = useSidebarCollapsed()
  const unreadCount = useUnreadNotificationsCount()
  const { communityHasUnread, supportHasUnread } = useStudentSidebarUnread()

  async function handleLogout() {
    await logout()
    navigate(ROUTE_PATHS.LOGIN, { replace: true })
  }

  return (
    <div className="app">
      <Sidebar
        role="student"
        userName={user?.fullName ?? ''}
        avatarUrl={user?.avatarUrl}
        activePath={location.pathname}
        onLogout={() => void handleLogout()}
        isRail={isRail}
        onToggleRail={() => setIsRail(!isRail)}
        profilePath={ROUTE_PATHS.STUDENT.PROFILE}
        communityHasUnread={communityHasUnread}
        supportHasUnread={supportHasUnread}
      />

      <div className="main">
        <div className="sheet">
          <Topbar
            notificationCount={unreadCount}
            notificationsPath={ROUTE_PATHS.STUDENT.NOTIFICATIONS}
            onSettingsClick={() => navigate(ROUTE_PATHS.STUDENT.SETTINGS)}
            onLogoClick={() => navigate(ROUTE_PATHS.STUDENT.DASHBOARD)}
          />

          <div className="page">{children ?? <Outlet />}</div>
        </div>
      </div>

      <FloatingAssistant role="student" />
    </div>
  )
}
