import { useState } from 'react'
import { ApiError } from '../../../shared/api/api-error'
import { EmptyState } from '../../../shared/components/EmptyState'
import { ErrorState } from '../../../shared/components/ErrorState'
import { LoadingState } from '../../../shared/components/LoadingState'
import { PageHeader } from '../../../shared/components/PageHeader'
import { ConfirmModal } from '../../../shared/components/ConfirmModal'
import { showToast } from '../../../shared/components/Toast'
import { useAdminAgentLogs } from '../hooks/useAdminAgentLogs'
import { deleteAdminAgentLog } from '../api/admin-agent-logs.api'

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' })
}

const STATUS_CHIP: Record<string, string> = {
  success: 'green',
  failed: 'red',
  retrying: 'pink',
  skipped: 'outline',
}

export function AdminAgentLogsPage() {
  const { data, isLoading, error, refetch } = useAdminAgentLogs({})
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  async function handleConfirmDelete() {
    if (!deleteTargetId || deletingId) return

    setDeletingId(deleteTargetId)
    setActionError(null)
    try {
      await deleteAdminAgentLog(deleteTargetId)
      setDeleteTargetId(null)
      showToast('تم حذف السجل بنجاح', 'success')
      refetch()
    } catch (err) {
      setDeleteTargetId(null)
      showToast('حدث خطأ أثناء حذف السجل. حاول مرة أخرى.', 'error')
      setActionError(err instanceof ApiError ? err.message : 'تعذر حذف السجل، حاول مرة أخرى')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <>
      <PageHeader title="سجل الوكلاء" description="كل عمليات وكلاء الذكاء الاصطناعي على المنصة" />

      {actionError && (
        <p role="alert" className="section" style={{ color: 'var(--error)', fontSize: 13.5, fontWeight: 600 }}>
          {actionError}
        </p>
      )}

      {isLoading && <LoadingState variant="list" />}

      {!isLoading && error && (
        <ErrorState title="تعذر تحميل السجل" message="لم نتمكن من تحميل سجل الوكلاء." onRetry={refetch} />
      )}

      {!isLoading && !error && data && data.length === 0 && (
        <EmptyState fullPage title="لا توجد سجلات" message="مفيش عمليات وكلاء مسجلة حاليًا" />
      )}

      {!isLoading && !error && data && data.length > 0 && (
        <div className="table-wrap section">
          <table className="mtable">
            <thead>
              <tr>
                <th>الوكيل</th>
                <th>الإجراء</th>
                <th>الحالة</th>
                <th>التاريخ</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {data.map((log) => (
                <tr key={log.id}>
                  <td>{log.agentType}</td>
                  <td>
                    {log.action}
                    {log.errorMessage && (
                      <span className="meta" style={{ display: 'block', color: 'var(--error)' }}>
                        {log.errorMessage}
                      </span>
                    )}
                  </td>
                  <td>
                    <span className={`chip ${STATUS_CHIP[log.status] ?? ''}`}>{log.status}</span>
                  </td>
                  <td>{formatDateTime(log.executedAt)}</td>
                  <td>
                    <button
                      type="button"
                      className="btn text"
                      disabled={deletingId === log.id}
                      onClick={() => setDeleteTargetId(log.id)}
                    >
                      <span className="ms">delete</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmModal
        open={deleteTargetId !== null}
        title="حذف السجل"
        message="هل أنت متأكد من حذف هذا السجل نهائيًا؟ لا يمكن التراجع عن هذا الإجراء."
        confirmLabel="حذف السجل"
        cancelLabel="إلغاء"
        isLoading={deletingId !== null}
        variant="danger"
        onConfirm={() => void handleConfirmDelete()}
        onCancel={() => setDeleteTargetId(null)}
      />
    </>
  )
}
