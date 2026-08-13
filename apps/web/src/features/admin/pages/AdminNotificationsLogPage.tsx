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
import { useAdminNotifications } from '../hooks/useAdminNotifications'
import { deleteAdminNotification } from '../api/admin-notifications.api'
import type { AdminNotificationListItem } from '../types/admin.types'

const PAGE_SIZE = 10

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' })
}

export function AdminNotificationsLogPage() {
  const { data, isLoading, error, refetch } = useAdminNotifications({})

  const toHaystack = useCallback((item: AdminNotificationListItem) => `${item.userName} ${item.title} ${item.message}`, [])
  const list = usePaginatedList(data, toHaystack, PAGE_SIZE)
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  async function handleConfirmDelete() {
    if (!deleteTargetId || deletingId) return

    setDeletingId(deleteTargetId)
    setActionError(null)
    try {
      await deleteAdminNotification(deleteTargetId)
      setDeleteTargetId(null)
      showToast('تم حذف الإشعار بنجاح', 'success')
      refetch()
    } catch (err) {
      setDeleteTargetId(null)
      showToast('حدث خطأ أثناء حذف الإشعار. حاول مرة أخرى.', 'error')
      setActionError(err instanceof ApiError ? err.message : 'تعذر حذف الإشعار، حاول مرة أخرى')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <>
      <PageHeader title="سجل كل الإشعارات" description="كل الإشعارات المرسلة لكل المستخدمين على المنصة" />

      {actionError && (
        <p role="alert" className="section" style={{ color: 'var(--error)', fontSize: 13.5, fontWeight: 600 }}>
          {actionError}
        </p>
      )}

      <SearchField
        id="admin-notifications-search"
        label="بحث في الإشعارات"
        placeholder="ابحث باسم المستخدم أو عنوان الإشعار..."
        value={list.query}
        onChange={list.search}
      />

      {isLoading && <LoadingState variant="list" />}

      {!isLoading && error && (
        <ErrorState title="تعذر تحميل الإشعارات" message="لم نتمكن من تحميل السجل." onRetry={refetch} />
      )}

      {!isLoading && !error && data && data.length === 0 && (
        <EmptyState fullPage title="لا توجد إشعارات" message="مفيش إشعارات مسجلة حاليًا" />
      )}

      {!isLoading && !error && list.isEmptyResult && (
        <EmptyState fullPage title="لا توجد نتائج" message="مفيش نتائج مطابقة لبحثك، جرّب كلمة تانية" />
      )}

      {!isLoading && !error && list.pageItems.length > 0 && (
        <div className="table-wrap section">
          <table className="mtable">
            <thead>
              <tr>
                <th>المستخدم</th>
                <th>العنوان</th>
                <th>مقروء</th>
                <th>التاريخ</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {list.pageItems.map((item) => (
                <tr key={item.id}>
                  <td>{item.userName}</td>
                  <td>
                    <strong>{item.title}</strong>
                    <span className="meta" style={{ display: 'block' }}>
                      {item.message}
                    </span>
                  </td>
                  <td>
                    <span className={`chip ${item.isRead ? 'green' : 'outline'}`}>
                      {item.isRead ? 'مقروء' : 'غير مقروء'}
                    </span>
                  </td>
                  <td>{formatDateTime(item.createdAt)}</td>
                  <td>
                    <button
                      type="button"
                      className="btn text"
                      disabled={deletingId === item.id}
                      onClick={() => setDeleteTargetId(item.id)}
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

      {!isLoading && !error && list.hasPages && (
        <Pagination
          page={list.page}
          totalPages={list.totalPages}
          onPageChange={list.setPage}
          matchCount={list.matchCount}
          pageSize={PAGE_SIZE}
          itemLabel="إشعار"
        />
      )}

      <ConfirmModal
        open={deleteTargetId !== null}
        title="حذف الإشعار"
        message="هل أنت متأكد من حذف هذا الإشعار؟ لا يمكن التراجع عن هذا الإجراء."
        confirmLabel="حذف الإشعار"
        cancelLabel="إلغاء"
        isLoading={deletingId !== null}
        variant="danger"
        onConfirm={() => void handleConfirmDelete()}
        onCancel={() => setDeleteTargetId(null)}
      />
    </>
  )
}
