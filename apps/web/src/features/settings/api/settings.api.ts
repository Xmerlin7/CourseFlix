import { httpClient } from '../../../shared/api/http-client'
import type { UpdateSettingsPayload, UserSettings } from '../types/settings.types'

export async function getSettings(): Promise<UserSettings> {
  return httpClient.get<UserSettings>('/users/me/settings')
}

export async function updateSettings(payload: UpdateSettingsPayload): Promise<UserSettings> {
  return httpClient.patch<UserSettings>('/users/me/settings', payload)
}
