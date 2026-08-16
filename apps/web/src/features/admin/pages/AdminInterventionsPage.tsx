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
import { useAdminInterventions } from '../hooks/useAdminInterventions'
import {
  deleteAdminIntervention,
  updateAdminInterventionStatus,
} from '../api/admin-interventions.api'
import type { InterventionStatus, AdminInterventionListItem } from '../types/admin.types'

const RULE_LABELS: Record<string, string> = {
  low_quiz_score: 'نتيجة اختبار منخفضة',
  explicit_confusion_phrase: 'صعوبة في الفهم',
  repeated_concept_question: 'سؤال متكرر',
}

type StatusFilter = InterventionStatus | 'all'

const PAGE_SIZE = 10

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' })
}

export function AdminInterventionsPage() {
  const [status, setStatus] = useState<StatusFilter>('all')
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const { data, isLoading, error, refetch } = useAdminInterventions({
    status: status === 'all' ? undefined : status,
  })

  const toHaystack = useCallback((item: AdminInterventionListItem) => `${item.studentName} ${item.teacherName} ${item.weakConcept} ${RULE_LABELS[item.ruleKey] ?? item.ruleKey}`, [])
  const list = usePaginatedList(data, toHaystack, PAGE_SIZE)

  async function handleToggleStatus(id: string, current: InterventionStatus) {
    setBusyId(id)
    setActionError(null)
    try {
      await updateAdminInterventionStatus(id, current === 'active' ? 'resolved' : 'active')
      refetch()
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'تعذر تحديث الحالة، حاول مرة أخرى')
    } finally {
      setBusyId(null)
    }
  }

  async function handleConfirmDelete() {
    if (!deleteTargetId || busyId) return

    setBusyId(deleteTargetId)
    setActionError(null)
    try {
      await deleteAdminIntervention(deleteTargetId)
      setDeleteTargetId(null)
      showToast('تم حذف التنبيه بنجاح', 'success')
      refetch()
    } catch (err) {
      setDeleteTargetId(null)
      showToast('حدث خطأ أثناء حذف التنبيه. حاول مرة أخرى.', 'error')
      setActionError(err instanceof ApiError ? err.message : 'تعذر حذف التنبيه، حاول مرة أخرى')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <>
      <PageHeader title="تنبيهات المتابعة" description="كل تنبيهات الطلاب المتعثرين على المنصة" />

      <div className="actions section">
        {(['all', 'active', 'resolved'] as const).map((option) => (
          <button
            key={option}
            type="button"
            className={`chip clickable outline${status === option ? ' selected' : ''}`}
            aria-pressed={status === option}
            onClick={() => setStatus(option)}
          >
            {option === 'all' ? 'الكل' : option === 'active' ? 'نشط' : 'تم الحل'}
          </button>
        ))}
      </div>

      {actionError && (
        <p role="alert" className="section" style={{ color: 'var(--error)', fontSize: 13.5, fontWeight: 600 }}>
          {actionError}
        </p>
      )}

      <SearchField
        id="admin-interventions-search"
        label="بحث في التنبيهات"
        placeholder="ابحث باسم الطالب أو المفهوم..."
        value={list.query}
        onChange={list.search}
      />

      {isLoading && <LoadingState variant="list" />}

      {!isLoading && error && (
        <ErrorState title="تعذر تحميل التنبيهات" message="لم نتمكن من تحميل قائمة التنبيهات." onRetry={refetch} />
      )}

      {!isLoading && !error && data && data.length === 0 && (
        <EmptyState fullPage title="لا توجد تنبيهات" message="مفيش تنبيهات مطابقة للفلتر الحالي" />
      )}

      {!isLoading && !error && list.isEmptyResult && (
        <EmptyState fullPage title="لا توجد نتائج" message="مفيش نتائج مطابقة لبحثك، جرّب كلمة تانية" />
      )}

      {!isLoading && !error && list.pageItems.length > 0 && (
        <div className="table-wrap section">
          <table className="mtable">
            <thead>
              <tr>
                <th>الطالب</th>
                <th>المعلم</th>
                <th>السبب</th>
                <th>الحالة</th>
                <th>التاريخ</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {list.pageItems.map((item) => (
                <tr key={item.id}>
                  <td>{item.studentName}</td>
                  <td>{item.teacherName}</td>
                  <td>
                    {RULE_LABELS[item.ruleKey] ?? item.ruleKey}
                    <span className="meta" style={{ display: 'block' }}>
                      {item.weakConcept}
                    </span>
                  </td>
                  <td>
                    <span className={`chip ${item.status === 'active' ? 'red' : 'green'}`}>
                      {item.status === 'active' ? 'نشط' : 'تم الحل'}
                    </span>
                  </td>
                  <td>{formatDate(item.createdAt)}</td>
                  <td>
                    <div className="actions">
                      <button
                        type="button"
                        className="btn text"
                        disabled={busyId === item.id}
                        onClick={() => void handleToggleStatus(item.id, item.status)}
                      >
                        {item.status === 'active' ? 'وضع كمحلول' : 'إعادة فتح'}
                      </button>
                      <button
                        type="button"
                        className="btn text"
                        disabled={busyId === item.id}
                        onClick={() => setDeleteTargetId(item.id)}
                      >
                        <span className="ms">delete</span>
                      </button>
                    </div>
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
          itemLabel="تنبيه"
        />
      )}

      <ConfirmModal
        open={deleteTargetId !== null}
        title="حذف التنبيه"
        message="هل أنت متأكد من حذف هذا التنبيه نهائيًا؟ لا يمكن التراجع عن هذا الإجراء."
        confirmLabel="حذف التنبيه"
        cancelLabel="إلغاء"
        isLoading={busyId !== null}
        variant="danger"
        onConfirm={() => void handleConfirmDelete()}
        onCancel={() => setDeleteTargetId(null)}
      />
    </>
  )
}
