import { httpClient } from '../../../shared/api/http-client'
import type { AuthUser } from '../../auth/types/auth.types'
import type { UpdateProfilePayload } from '../types/profile.types'

export async function updateProfile(payload: UpdateProfilePayload): Promise<AuthUser> {
  return httpClient.patch<AuthUser>('/users/me/profile', payload)
}

export async function uploadAvatar(file: File): Promise<AuthUser> {
  const formData = new FormData()
  formData.append('file', file)
  return httpClient.postMultipart<AuthUser>('/users/me/avatar', formData)
}
