import { httpClient } from '../../../shared/api/http-client'
import type { AuthPosterContent, UpdateAuthPosterPayload } from '../types/auth-poster.types'

export async function getPublicAuthPoster(): Promise<AuthPosterContent> {
  return httpClient.get<AuthPosterContent>('/public/auth-poster')
}

export async function getAdminAuthPoster(): Promise<AuthPosterContent> {
  return httpClient.get<AuthPosterContent>('/admin/auth-poster')
}

export async function updateAdminAuthPoster(
  payload: UpdateAuthPosterPayload,
): Promise<AuthPosterContent> {
  return httpClient.patch<AuthPosterContent>('/admin/auth-poster', payload)
}
