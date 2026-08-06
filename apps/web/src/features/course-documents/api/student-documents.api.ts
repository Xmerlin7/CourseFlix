import { httpClient } from '../../../shared/api/http-client'
import type { StudentDocument } from '../types/student-document.types'

export async function getStudentCourseDocuments(
  courseId: string,
): Promise<StudentDocument[]> {
  return httpClient.get<StudentDocument[]>(
    `/student/courses/${courseId}/documents`,
  )
}

/**
 * Returns the full download URL for opening in a new tab.
 * The backend streams the file with `Content-Disposition: inline`, so
 * the browser will open it directly (PDF viewer, image viewer, etc.)
 * without needing any client-side library.
 */
export function getDocumentDownloadUrl(documentId: string): string {
  const base =
    import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api/v1'
  return `${base}/student/documents/${documentId}/download`
}
