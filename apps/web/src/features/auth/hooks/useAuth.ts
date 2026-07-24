import { useCallback, useState } from 'react'
import { getCurrentUser, login as loginRequest, logout as logoutRequest } from '../api/auth.api'
import { ApiError } from '../../../shared/api/api-error'
import type { AuthUser, LoginPayload } from '../types/auth.types'

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const login = useCallback(async (payload: LoginPayload): Promise<AuthUser> => {
    setIsLoading(true)
    setError(null)

    try {
      const authenticatedUser = await loginRequest(payload)
      setUser(authenticatedUser)
      return authenticatedUser
    } catch (caughtError) {
      // Same generic message regardless of the underlying reason — never
      // reveal whether the email exists or the password was wrong.
      const message =
        caughtError instanceof ApiError && caughtError.status === 401
          ? 'Incorrect email address or password.'

          : 'An error occurred, please try again.'

      setError(message)
      throw caughtError
    } finally {
      setIsLoading(false)
    }
  }, [])

  const logout = useCallback(async (): Promise<void> => {
    await logoutRequest()
    setUser(null)
  }, [])

  const refreshCurrentUser = useCallback(async (): Promise<void> => {
    try {
      setUser(await getCurrentUser())
    } catch {
      setUser(null)
    }
  }, [])

  return { user, isLoading, error, login, logout, refreshCurrentUser }
}