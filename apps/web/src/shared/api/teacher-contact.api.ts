import { httpClient } from './http-client'

export interface TeacherContact {
  teacherName: string
  whatsappNumber: string | null
  whatsappHref: string | null
}

export function getTeacherContact(): Promise<TeacherContact> {
  return httpClient.get<TeacherContact>('/public/teacher-contact')
}
