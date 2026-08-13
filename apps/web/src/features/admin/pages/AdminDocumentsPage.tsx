import { useState, useCallback } from 'react'
import { ApiError } from '../../../shared/api/api-error'
import { EmptyState } from '../../../shared/components/EmptyState'
import { ErrorState } from '../../../shared/components/ErrorState'
import { LoadingState } from '../../../shared/components/LoadingState'
import { PageHeader } from '../../../shared/components/PageHeader'
import { Pagination } from '../../../shared/components/Pagination'
import { SearchField } from '../../../shared/components/SearchField'
import { usePaginatedList } from '../../../shared/hooks/usePaginatedList'
import { ConfirmModal } from '../../../shared/components/ConfirmModal'
import { showToast } from '../../../shared/components/Toast'
import { DOCUMENT_STATUS } from '../../../shared/lib/status-labels'
import { useAdminDocuments } from '../hooks/useAdminDocuments'
import { deleteAdminDocument, getAdminDocumentViewUrl } from '../api/admin-documents.api'
import type { AdminDocumentListItem } from '../types/admin.types'

const PAGE_SIZE = 10

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' })
}

export function AdminDocumentsPage() {
  const { data, isLoading, error, refetch } = useAdminDocuments({})

  const toHaystack = useCallback((document: AdminDocumentListItem) => `${document.fileName} ${document.courseTitle} ${document.processingStatus}`, [])
  const list = usePaginatedList(data, toHaystack, PAGE_SIZE)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; fileName: string } | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  async function handleConfirmDelete() {
    if (!deleteTarget || deletingId) return

    setDeletingId(deleteTarget.id)
    setActionError(null)
    try {
      await deleteAdminDocument(deleteTarget.id)
      setDeleteTarget(null)
      showToast('تم حذف المستند بنجاح', 'success')
      refetch()
    } catch (err) {
      setDeleteTarget(null)
      showToast('حدث خطأ أثناء حذف المستند. حاول مرة أخرى.', 'error')
      setActionError(err instanceof ApiError ? err.message : 'تعذر حذف المستند، حاول مرة أخرى')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <>
      <PageHeader title="المستندات" description="كل المستندات المرفوعة على المنصة" />

      {actionError && (
        <p role="alert" className="section" style={{ color: 'var(--error)', fontSize: 13.5, fontWeight: 600 }}>
          {actionError}
        </p>
      )}

      <SearchField
        id="admin-documents-search"
        label="بحث في المستندات"
        placeholder="ابحث باسم الملف أو الدورة..."
        value={list.query}
        onChange={list.search}
      />

      {isLoading && <LoadingState variant="list" />}

      {!isLoading && error && (
        <ErrorState
          title="تعذر تحميل المستندات"
          message="لم نتمكن من تحميل قائمة المستندات، جرب مرة أخرى."
          onRetry={refetch}
        />
      )}

      {!isLoading && !error && data && data.length === 0 && (
        <EmptyState fullPage title="لا توجد مستندات" message="مفيش مستندات مرفوعة على المنصة حاليًا" />
      )}

      {!isLoading && !error && list.isEmptyResult && (
        <EmptyState fullPage title="لا توجد نتائج" message="مفيش نتائج مطابقة لبحثك، جرّب كلمة تانية" />
      )}

      {!isLoading && !error && list.pageItems.length > 0 && (
        <div className="table-wrap section">
          <table className="mtable">
            <thead>
              <tr>
                <th>الملف</th>
                <th>الدورة</th>
                <th>الحالة</th>
                <th>الإصدار</th>
                <th>تاريخ الرفع</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {list.pageItems.map((document) => {
                const statusLabel = DOCUMENT_STATUS[document.processingStatus]
                return (
                  <tr key={document.id}>
                    <td>
                      <strong>{document.fileName}</strong>
                      {document.errorMessage && (
                        <span className="meta" style={{ display: 'block', color: 'var(--error)' }}>
                          {document.errorMessage}
                        </span>
                      )}
                    </td>
                    <td>{document.courseTitle}</td>
                    <td>
                      <span className={`chip ${statusLabel.chip}`}>
                        <span className="ms" style={{ fontSize: 16 }}>
                          {statusLabel.icon}
                        </span>
                        {statusLabel.label}
                      </span>
                    </td>
                    <td>{document.version}</td>
                    <td>{formatDate(document.createdAt)}</td>
                    <td>
                      <div className="actions">
                        <a
                          href={getAdminDocumentViewUrl(document.id)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn text"
                        >
                          <span className="ms">visibility</span>
                          عرض
                        </a>
                        <button
                          type="button"
                          className="btn text"
                          disabled={deletingId === document.id}
                          onClick={() => setDeleteTarget({ id: document.id, fileName: document.fileName })}
                        >
                          <span className="ms">delete</span>
                          حذف
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {!isLoading && !error && list.hasPages && (
        <Pagination
          page={list.page}
          totalPages={list.totalPages}
          onPageChange={list.setPage}
          matchCount={list.matchCount}
          pageSize={PAGE_SIZE}
          itemLabel="مستند"
        />
      )}

      <ConfirmModal
        open={deleteTarget !== null}
        title="حذف المستند"
        message={`هل أنت متأكد من حذف المستند "${deleteTarget?.fileName ?? ''}"؟ لا يمكن التراجع عن هذا الإجراء.`}
        confirmLabel="حذف المستند"
        cancelLabel="إلغاء"
        isLoading={deletingId !== null}
        variant="danger"
        onConfirm={() => void handleConfirmDelete()}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  )
}
