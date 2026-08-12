import { createContext, useCallback, useEffect, useState } from 'react'
import type { PropsWithChildren } from 'react'
import {
  getCurrentUser,
  login as loginRequest,
  logout as logoutRequest,
  register as registerRequest,
  verifyOtp as verifyOtpRequest,
} from '../api/auth.api'
import type {
  AuthUser,
  LoginPayload,
  OtpResponse,
  OtpVerifyPayload,
  RegisterPayload,
} from '../types/auth.types'

export interface AuthContextValue {
  user: AuthUser | null
  isLoading: boolean
  // Standard login returns the user (session cookie set). With
  // `requireOtp: true` a login OTP is emailed instead and an OtpResponse is
  // returned — no user, no session yet; sign in via `verifyOtp` next.
  login: (payload: LoginPayload) => Promise<AuthUser | OtpResponse>
  logout: () => Promise<void>
  // Creates an inactive account and emails a verification OTP — it does
  // NOT sign the user in. That happens via verifyOtp (purpose 'register').
  register: (payload: RegisterPayload) => Promise<OtpResponse>
  // Redeems an OTP (login or register) and signs the user in.
  verifyOtp: (payload: OtpVerifyPayload) => Promise<AuthUser>
  // Merges a partial profile update (e.g. after a successful PATCH
  // /users/me/profile) into the signed-in user so the sidebar/topbar
  // stay in sync without a full re-fetch. No-op while signed out.
  updateUser: (patch: Partial<AuthUser>) => void
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
    const result = await loginRequest(payload)
    if ('role' in result) {
      setUser(result)
    }
    return result
  }, [])

  const logout = useCallback(async () => {
    await logoutRequest()
    setUser(null)
  }, [])

  const register = useCallback(async (payload: RegisterPayload) => {
    // No session is created here — just the account + verification code.
    return registerRequest(payload)
  }, [])

  const verifyOtp = useCallback(async (payload: OtpVerifyPayload) => {
    const user = await verifyOtpRequest(payload)
    setUser(user)
    return user
  }, [])

  const updateUser = useCallback((patch: Partial<AuthUser>) => {
    setUser((current) => (current ? { ...current, ...patch } : current))
  }, [])

  return (
    <AuthContext.Provider
      value={{ user, isLoading, login, logout, register, verifyOtp, updateUser }}
    >
      {children}
    </AuthContext.Provider>
  )
}
