import { Outlet } from 'react-router'
import type { PropsWithChildren } from 'react'

export function StudentLayout({ children }: PropsWithChildren) {
  // TODO: student shell with navigation, theme toggle, and authenticated page frame.
  return children ? <>{children}</> : <Outlet />
}
