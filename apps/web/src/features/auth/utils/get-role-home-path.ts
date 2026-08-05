import { ROUTE_PATHS } from '../../../app/routes/route-paths'
import type { UserRole } from '../types/auth.types'

export function getRoleHomePath(role: UserRole): string {
  return role === 'teacher' ? ROUTE_PATHS.TEACHER.DASHBOARD : ROUTE_PATHS.STUDENT.DASHBOARD
}
