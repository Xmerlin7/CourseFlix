import { Outlet } from 'react-router'
import type { PropsWithChildren } from 'react'

export function AuthLayout({ children }: PropsWithChildren) {
  return (
    <div
      className="flex min-h-screen items-center justify-center bg-gray-50 p-4 dark:bg-gray-900"
      dir="rtl"
    >
      <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        {children ?? <Outlet />}
      </div>
    </div>
  )
}
