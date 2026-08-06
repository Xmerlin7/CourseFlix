import { getDocumentDownloadUrl } from '../api/student-documents.api'
import { useStudentDocuments } from '../hooks/useStudentDocuments'
import { EmptyState } from '../../../shared/components/EmptyState'

interface StudentDocumentsListProps {
  courseId: string
}

/**
 * Renders a "المواد والملفات" section for enrolled students, listing
 * every completed document in the course with a download link that
 * opens in a new tab (Content-Disposition: inline from the API).
 */
export function StudentDocumentsList({ courseId }: StudentDocumentsListProps) {
  const { data: documents, isLoading, error } = useStudentDocuments(courseId)

  if (isLoading) {
    return (
      <section className="section" id="student-documents-section">
        <div className="section-head">
          <h2>المواد والملفات</h2>
        </div>
        <p className="subtitle">جارٍ تحميل الملفات...</p>
      </section>
    )
  }

  if (error) {
    return (
      <section className="section" id="student-documents-section">
        <div className="section-head">
          <h2>المواد والملفات</h2>
        </div>
        <p role="alert" style={{ color: 'var(--error)', fontSize: 13.5, fontWeight: 700 }}>
          تعذر تحميل ملفات الدورة
        </p>
      </section>
    )
  }

  return (
    <section className="section" id="student-documents-section">
      <div className="section-head">
        <h2>المواد والملفات</h2>
      </div>

      {documents.length === 0 ? (
        <EmptyState
          title="لا توجد مواد حتى الآن"
          message="لما يتم رفع ملفات ومواد للدورة هتظهر هنا"
        />
      ) : (
        <div className="list">
          {documents.map((doc) => (
            <a
              key={doc.id}
              href={getDocumentDownloadUrl(doc.id)}
              target="_blank"
              rel="noopener noreferrer"
              className="list-item"
            >
              <span className="lead">
                <span className="ms">description</span>
              </span>
              <span className="body">
                <span className="t">{doc.fileName}</span>
                <span className="s">
                  {new Date(doc.createdAt).toLocaleDateString('ar-EG', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              </span>
              <span className="end">
                <span className="ms" aria-hidden="true">open_in_new</span>
              </span>
            </a>
          ))}
        </div>
      )}
    </section>
  )
}
