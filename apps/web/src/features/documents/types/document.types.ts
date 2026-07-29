export type DocumentProcessingStatus = 'pending' | 'processing' | 'completed' | 'failed'

export interface CourseDocument {
  id: string
  fileName: string
  processingStatus: DocumentProcessingStatus
  version: number
  createdAt: string
  errorMessage: string | null
}

export interface UploadDocumentResponse {
  id: string
  fileName: string
  processingStatus: DocumentProcessingStatus
  version: number
}

export interface RetryDocumentResponse {
  id: string
  processingStatus: DocumentProcessingStatus
}
