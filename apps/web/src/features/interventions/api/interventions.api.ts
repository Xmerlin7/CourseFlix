import { httpClient } from '../../../shared/api/http-client'
import type { StudentIntervention, TeacherIntervention } from '../types/intervention.types'

export async function getStudentInterventions(): Promise<StudentIntervention[]> {
  return httpClient.get<StudentIntervention[]>('/student/interventions')
}

export async function getTeacherInterventions(): Promise<TeacherIntervention[]> {
  return httpClient.get<TeacherIntervention[]>('/teacher/interventions')
}
