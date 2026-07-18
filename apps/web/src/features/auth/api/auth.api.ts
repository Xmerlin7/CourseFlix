import { httpClient } from '../../../shared/api/http-client'
import type { AuthUser, LoginPayload } from '../types/auth.types'

export async function login(payload: LoginPayload): Promise<AuthUser> {
  return httpClient.post<AuthUser>('/auth/login', payload)
}

export async function logout(): Promise<void> {
  return httpClient.post<void>('/auth/logout')
}

export async function getCurrentUser(): Promise<AuthUser> {
  return httpClient.get<AuthUser>('/me')
}
