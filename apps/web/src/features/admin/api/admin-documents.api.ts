import { httpClient } from '../../../shared/api/http-client'
import type { AdminDocumentListItem, AdminDocumentsFilter } from '../types/admin.types'

export async function getAdminDocuments(
  filters: AdminDocumentsFilter = {},
): Promise<AdminDocumentListItem[]> {
  return httpClient.get<AdminDocumentListItem[]>('/admin/documents', { searchParams: filters })
}

export async function deleteAdminDocument(documentId: string): Promise<void> {
  await httpClient.delete(`/admin/documents/${documentId}`)
}
