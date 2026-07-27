import type { CourseDocument, DocumentProcessingStatus } from '../types/document.types'

const STATUS_LABEL: Record<DocumentProcessingStatus, string> = {
  pending: 'في الانتظار',
  processing: 'قيد المعالجة',
  completed: 'تمت المعالجة',
  failed: 'فشلت المعالجة',
}

const STATUS_CLASS: Record<DocumentProcessingStatus, string> = {
  pending: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  processing: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  failed: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

interface DocumentStatusListProps {
  documents: CourseDocument[]
  onRetry: (documentId: string) => Promise<void>
}

export function DocumentStatusList({ documents, onRetry }: DocumentStatusListProps) {
  if (documents.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
        لا توجد ملفات مرفوعة بعد
      </p>
    )
  }

  return (
    <ul className="flex flex-col gap-2" dir="rtl">
      {documents.map((doc) => (
        <li
          key={doc.id}
          className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 px-4 py-3 dark:border-gray-700"
        >
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {doc.fileName}
            </span>
            {doc.processingStatus === 'failed' && doc.errorMessage && (
              <span className="text-xs text-red-600 dark:text-red-400">{doc.errorMessage}</span>
            )}
            {doc.version > 1 && (
              <span className="text-xs text-gray-500 dark:text-gray-400">نسخة {doc.version}</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_CLASS[doc.processingStatus]}`}
            >
              {STATUS_LABEL[doc.processingStatus]}
            </span>
            {doc.processingStatus === 'failed' && (
              <button
                onClick={() => void onRetry(doc.id)}
                className="rounded-lg border border-gray-300 px-3 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                إعادة المحاولة
              </button>
            )}
          </div>
        </li>
      ))}
    </ul>
  )
}
