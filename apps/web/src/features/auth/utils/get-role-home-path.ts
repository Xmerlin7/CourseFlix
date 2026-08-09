import { ROUTE_PATHS } from '../../../app/routes/route-paths'
import type { UserRole } from '../types/auth.types'

// Students land on "دوراتي" after auth, not the dashboard — see
// StudentDashboardPage's docblock. The dashboard stays reachable from the
// sidebar/logo ("الرئيسية"); only the post-login/register destination
// changed. Teacher and admin are unaffected.
const ROLE_HOME_PATHS: Record<UserRole, string> = {
  student: ROUTE_PATHS.STUDENT.COURSES,
  teacher: ROUTE_PATHS.TEACHER.DASHBOARD,
  admin: ROUTE_PATHS.ADMIN.DASHBOARD,
}

export function getRoleHomePath(role: UserRole): string {
  return ROLE_HOME_PATHS[role]
}
