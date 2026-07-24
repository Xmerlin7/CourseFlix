import { Outlet } from 'react-router'
import type { PropsWithChildren } from 'react'

export function TeacherLayout({ children }: PropsWithChildren) {
  // TODO: teacher shell with course-management navigation and account controls.
  return children ? <>{children}</> : <Outlet />
}
