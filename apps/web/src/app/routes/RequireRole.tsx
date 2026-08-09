import { Navigate, Outlet } from 'react-router'
import { useAuth } from '../../features/auth/hooks/useAuth'
import type { UserRole } from '../../features/auth/types/auth.types'
import { LoadingState } from '../../shared/components/LoadingState'
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

  if (isLoading) {
    return <LoadingState variant="text" />
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
