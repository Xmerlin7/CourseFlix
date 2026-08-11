import type { PropsWithChildren } from 'react'
import { AuthProvider } from '../../features/auth/context/AuthContext'
import { ThemeProvider } from '../../shared/hooks/useTheme'

// Router is composed directly in App.tsx (AppRouter renders inside this).
// Analytics/TanStack Query aren't installed yet — add them here if/when
// they land.
export function AppProviders({ children }: PropsWithChildren) {
  return (
    <ThemeProvider>
      <AuthProvider>{children}</AuthProvider>
    </ThemeProvider>
  )
}
