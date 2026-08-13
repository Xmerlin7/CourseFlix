import { httpClient } from '../../../shared/api/http-client'
import type {
  AdminTeacherQuota,
  TeacherQuota,
  TopUpQuotaPayload,
} from '../types/teacher-billing.types'

/** Teacher's own quota — the API blocks assistants from this route. */
export async function getTeacherQuota(): Promise<TeacherQuota> {
  return httpClient.get<TeacherQuota>('/teacher/quota')
}

/** Every teacher's quota, for the admin users surface. */
export async function getAdminQuotas(): Promise<AdminTeacherQuota[]> {
  return httpClient.get<AdminTeacherQuota[]>('/admin/quotas')
}

export async function topUpTeacherQuota(
  teacherId: string,
  payload: TopUpQuotaPayload,
): Promise<TeacherQuota> {
  return httpClient.post<TeacherQuota>(`/admin/quotas/${teacherId}/top-up`, payload)
}
