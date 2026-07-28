import { DOCUMENT_STATUS } from '../../../shared/lib/status-labels'
import type { CourseDocument } from '../types/document.types'

interface DocumentStatusListProps {
  documents: CourseDocument[]
  onRetry: (documentId: string) => Promise<void>
}

export function DocumentStatusList({ documents, onRetry }: DocumentStatusListProps) {
  if (documents.length === 0) {
    return <p className="subtitle">لا توجد ملفات مرفوعة بعد</p>
  }

  return (
    <div className="list">
      {documents.map((doc) => {
        const status = DOCUMENT_STATUS[doc.processingStatus]

        return (
          <div key={doc.id} className="list-item">
            <span className={`lead ${status.chip}`}>
              <span className="ms">picture_as_pdf</span>
            </span>

            <span className="body">
              <span className="t">{doc.fileName}</span>
              <span className="s">
                {doc.processingStatus === 'failed' && doc.errorMessage
                  ? doc.errorMessage
                  : doc.version > 1
                    ? `النسخة ${doc.version}`
                    : new Date(doc.createdAt).toLocaleDateString('ar-EG')}
              </span>
            </span>

            <span className="end">
              <span className={`chip ${status.chip}`}>
                <span className="ms">{status.icon}</span>
                {status.label}
              </span>

              {doc.processingStatus === 'failed' && (
                <button
                  type="button"
                  onClick={() => void onRetry(doc.id)}
                  className="btn text"
                >
                  إعادة المحاولة
                </button>
              )}
            </span>
          </div>
        )
      })}
    </div>
  )
}
