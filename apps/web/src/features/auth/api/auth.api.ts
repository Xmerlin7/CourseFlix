import { httpClient } from '../../../shared/api/http-client'
import type {
  AuthUser,
  LoginPayload,
  OtpRequestPayload,
  OtpResponse,
  OtpVerifyPayload,
  PasswordResetPayload,
  RegisterPayload,
} from '../types/auth.types'

// Backend wraps the session-creating login/verify responses as `{ user }`
// (see auth.controller.ts), unlike GET /me which returns the user directly.
// Unwrap it so callers work with a plain AuthUser.
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

// No session is issued at registration anymore — the API creates the
// account as inactive and emails a verification OTP. Callers must show the
// code step and then `verifyOtp` (purpose 'register') to activate + log in.
export async function register(payload: RegisterPayload): Promise<OtpResponse> {
  return httpClient.post<OtpResponse>('/auth/register', payload)
}

export async function requestOtp(payload: OtpRequestPayload): Promise<OtpResponse> {
  return httpClient.post<OtpResponse>('/auth/otp/request', payload)
}

export async function verifyOtp(payload: OtpVerifyPayload): Promise<AuthUser> {
  const { user } = await httpClient.post<{ user: AuthUser }>('/auth/otp/verify', payload)
  return user
}

export async function requestPasswordReset(email: string): Promise<OtpResponse> {
  return httpClient.post<OtpResponse>('/auth/password/request', { email })
}

export async function resetPassword(payload: PasswordResetPayload): Promise<void> {
  await httpClient.post<{ success: true }>('/auth/password/reset', payload)
}
