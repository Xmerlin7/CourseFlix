import { httpClient } from '../../../shared/api/http-client'
import type { AuthUser } from '../../auth/types/auth.types'
import type {
  ChangePasswordPayload,
  UpdateProfilePayload,
  UpdateSettingsPayload,
  UserSettings,
} from '../types/settings.types'

export async function getSettings(): Promise<UserSettings> {
  return httpClient.get<UserSettings>('/users/me/settings')
}

export async function updateSettings(payload: UpdateSettingsPayload): Promise<UserSettings> {
  return httpClient.patch<UserSettings>('/users/me/settings', payload)
}

export async function updateProfile(payload: UpdateProfilePayload): Promise<AuthUser> {
  return httpClient.patch<AuthUser>('/users/me/profile', payload)
}

export async function changePassword(payload: ChangePasswordPayload): Promise<void> {
  return httpClient.patch<void>('/users/me/password', payload)
}
