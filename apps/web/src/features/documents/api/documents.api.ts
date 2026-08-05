import { httpClient } from '../../../shared/api/http-client'
import type {
  CourseDocument,
  RetryDocumentResponse,
  UploadDocumentResponse,
} from '../types/document.types'

export async function getCourseDocuments(courseId: string): Promise<CourseDocument[]> {
  return httpClient.get<CourseDocument[]>(`/teacher/courses/${courseId}/documents`)
}

export async function uploadCourseDocument(
  courseId: string,
  file: File,
): Promise<UploadDocumentResponse> {
  const formData = new FormData()
  formData.append('file', file)
  return httpClient.postMultipart<UploadDocumentResponse>(
    `/teacher/courses/${courseId}/documents`,
    formData,
  )
}

export async function retryDocument(documentId: string): Promise<RetryDocumentResponse> {
  return httpClient.post<RetryDocumentResponse>(`/teacher/documents/${documentId}/retry`)
}
