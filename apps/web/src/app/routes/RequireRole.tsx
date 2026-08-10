import { Navigate, Outlet } from 'react-router'
import { useAuth } from '../../features/auth/hooks/useAuth'
import type { UserRole } from '../../features/auth/types/auth.types'
import { ROUTE_PATHS } from './route-paths'

interface RequireRoleProps {
  role: UserRole | UserRole[]
}

/**
 * Client-side route guard for CF-US-002: unauthenticated users are sent
 * to login, and a signed-in user of the wrong role is sent to the shared
 * 403 state. This mirrors, but does not replace, the server-side
 * AuthGuard/*RoleGuard — the API is still the real authority.
 */
export function RequireRole({ role }: RequireRoleProps) {
  const { user, isLoading } = useAuth()

  // This gate runs before the role is known, so there's no real page
  // shell (topbar/sidebar) yet to build a matching skeleton for —
  // rendering the generic LoadingState here just floated three unrelated
  // gray bars over an otherwise blank screen for the brief GET /me
  // round-trip. Nothing beats that for something this short.
  if (isLoading) {
    return null
  }

  if (!user) {
    return <Navigate to={ROUTE_PATHS.LOGIN} replace />
  }

  const allowedRoles = Array.isArray(role) ? role : [role]
  if (!allowedRoles.includes(user.role)) {
    return <Navigate to={ROUTE_PATHS.FORBIDDEN} replace />
  }

  return <Outlet />
}
