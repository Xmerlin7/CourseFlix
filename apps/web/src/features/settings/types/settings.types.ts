import type { NotificationType } from '../../notifications/types/notification.types'

export type ThemeMode = 'light' | 'dark' | 'system'

export interface UserSettings {
  theme: ThemeMode
  notificationPreferences: Partial<Record<NotificationType, boolean>>
}

export interface UpdateSettingsPayload {
  theme?: ThemeMode
  notificationPreferences?: Partial<Record<NotificationType, boolean>>
}

export interface UpdateProfilePayload {
  fullName?: string
  avatarUrl?: string | null
}

export interface ChangePasswordPayload {
  currentPassword: string
  newPassword: string
}
