import { useCallback } from 'react'
import { Pagination } from '../../../shared/components/Pagination'
import { usePaginatedList } from '../../../shared/hooks/usePaginatedList'
import { DOCUMENT_STATUS } from '../../../shared/lib/status-labels'
import type { CourseDocument } from '../types/document.types'

const PAGE_SIZE = 10

interface DocumentStatusListProps {
  documents: CourseDocument[]
  onRetry: (documentId: string) => Promise<void>
}

export function DocumentStatusList({ documents, onRetry }: DocumentStatusListProps) {
  // Pager but no search box: this list sits inside the upload panel and
  // shows what the teacher just uploaded, so it's read newest-first
  // rather than looked up by name. The student-facing view of the same
  // files (StudentDocumentsList) is the one that gets searched.
  const toHaystack = useCallback((doc: CourseDocument) => doc.fileName, [])
  const list = usePaginatedList(documents, toHaystack, PAGE_SIZE)

  if (documents.length === 0) {
    return <p className="subtitle">لا توجد ملفات مرفوعة بعد</p>
  }

  return (
    <>
      <div className="list">
        {list.pageItems.map((doc) => {
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

      {list.hasPages && (
        <Pagination
          page={list.page}
          totalPages={list.totalPages}
          onPageChange={list.setPage}
          matchCount={list.matchCount}
          pageSize={PAGE_SIZE}
          itemLabel="ملف"
        />
      )}
    </>
  )
}
