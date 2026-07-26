import { httpClient } from '../../../shared/api/http-client'
import type { AuthUser, LoginPayload } from '../types/auth.types'

// Backend wraps the login response as `{ user }` (see auth.controller.ts),
// unlike GET /me which returns the user directly — unwrap here so callers
// only ever deal with a plain AuthUser.
export async function login(payload: LoginPayload): Promise<AuthUser> {
  const { user } = await httpClient.post<{ user: AuthUser }>('/auth/login', payload)
  return user
}

export async function logout(): Promise<void> {
  return httpClient.post<void>('/auth/logout')
}

export async function getCurrentUser(): Promise<AuthUser> {
  return httpClient.get<AuthUser>('/me')
}
