import { httpClient } from '../../../shared/api/http-client'
import type { AuthUser } from '../../auth/types/auth.types'
import type { UpdateProfilePayload } from '../types/profile.types'

export async function updateProfile(payload: UpdateProfilePayload): Promise<AuthUser> {
  return httpClient.patch<AuthUser>('/users/me/profile', payload)
}
