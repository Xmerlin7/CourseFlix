import type { PropsWithChildren } from 'react'
import { AuthProvider } from '../../features/auth/context/AuthContext'

// Router is composed directly in App.tsx (AppRouter renders inside this).
// Theme is handled locally by useTheme (localStorage + a DOM class),
// so it doesn't need a context provider. Analytics/TanStack Query aren't
// installed yet — add them here if/when they land.
export function AppProviders({ children }: PropsWithChildren) {
  return <AuthProvider>{children}</AuthProvider>
}
