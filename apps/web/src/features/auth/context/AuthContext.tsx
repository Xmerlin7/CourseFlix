import { createContext, useCallback, useEffect, useState } from 'react'
import type { PropsWithChildren } from 'react'
import { getCurrentUser, login as loginRequest, logout as logoutRequest, register as registerRequest } from '../api/auth.api'
import type { AuthUser, LoginPayload, RegisterPayload } from '../types/auth.types'

export interface AuthContextValue {
  user: AuthUser | null
  isLoading: boolean
  login: (payload: LoginPayload) => Promise<AuthUser>
  logout: () => Promise<void>
  register: (payload: RegisterPayload) => Promise<AuthUser>
}

// eslint-disable-next-line react-refresh/only-export-components -- context object is not a component; useAuth.ts needs it from this same module.
export const AuthContext = createContext<AuthContextValue | null>(null)

/**
 * Owns the single source of truth for "who is signed in" — session state
 * lives here, not in individual components, so the sidebar profile, the
 * login form, and route guards all agree on the same user. Bootstraps
 * from GET /me on mount (the signed cookie, if any, is sent automatically
 * by http-client's `credentials: 'include'`); a 401 just means signed out,
 * not an error.
 */
export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    getCurrentUser()
      .then((currentUser) => {
        if (!cancelled) setUser(currentUser)
      })
      .catch(() => {
        if (!cancelled) setUser(null)
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const login = useCallback(async (payload: LoginPayload) => {
    const loggedInUser = await loginRequest(payload)
    setUser(loggedInUser)
    return loggedInUser
  }, [])

  const logout = useCallback(async () => {
    await logoutRequest()
    setUser(null)
  }, [])

  const register = useCallback(async (payload: RegisterPayload) => {
    const user = await registerRequest(payload)
    setUser(user)
    return user
  }, [])

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  )
}
