import { useCallback, useState } from 'react'
import { EmptyState } from '../../../shared/components/EmptyState'
import { ErrorState } from '../../../shared/components/ErrorState'
import { LoadingState } from '../../../shared/components/LoadingState'
import { PageHeader } from '../../../shared/components/PageHeader'
import { Pagination } from '../../../shared/components/Pagination'
import { SearchField } from '../../../shared/components/SearchField'
import { showToast } from '../../../shared/components/Toast'
import { usePaginatedList } from '../../../shared/hooks/usePaginatedList'
import { useAuth } from '../../auth/hooks/useAuth'
import {
  approveAssistantAction,
  rejectAssistantAction,
} from '../api/assistant-actions.api'
import { useAssistantActions } from '../hooks/useAssistantActions'
import type { AssistantAction } from '../types/assistant-action.types'

const PAGE_SIZE = 10

const STATUS_FILTERS = [
  { value: 'pending', label: 'بانتظار المراجعة' },
  { value: 'approved', label: 'تمت الموافقة' },
  { value: 'rejected', label: 'مرفوضة' },
  { value: 'all', label: 'الكل' },
]

const STATUS_CHIP: Record<string, { label: string; chip: string; icon: string }> = {
  pending: { label: 'قيد المراجعة', chip: 'outline', icon: 'schedule' },
  approved: { label: 'تمت الموافقة', chip: 'green', icon: 'check_circle' },
  rejected: { label: 'مرفوض', chip: 'red', icon: 'cancel' },
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('ar-EG', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

/**
 * One page, two audiences.
 *
 * The teacher sees every action their assistants have parked and can
 * approve or reject each one. An assistant sees the same list filtered to
 * their own submissions, read-only, so they can tell what has landed and
 * what the teacher turned down — which is the whole point of parking the
 * write instead of silently dropping it.
 */
export function AssistantActionsPage() {
  const { user } = useAuth()
  const isReviewer = user?.role !== 'assistant'

  const [status, setStatus] = useState('pending')
  const [busyId, setBusyId] = useState<string | null>(null)
  const { data, isLoading, error, refetch } = useAssistantActions(status)

  const toHaystack = useCallback(
    (action: AssistantAction) => `${action.summary} ${action.assistantName}`,
    [],
  )
  const list = usePaginatedList(data, toHaystack, PAGE_SIZE)

  async function handleApprove(action: AssistantAction) {
    setBusyId(action.id)
    try {
      const result = await approveAssistantAction(action.id)
      showToast(
        result.executionError
          ? `تمت الموافقة لكن التنفيذ فشل: ${result.executionError}`
          : 'تمت الموافقة وتنفيذ الإجراء',
        result.executionError ? 'error' : 'success',
      )
      refetch()
    } catch {
      showToast('تعذر تنفيذ الموافقة، حاول مرة أخرى', 'error')
    } finally {
      setBusyId(null)
    }
  }

  async function handleReject(action: AssistantAction) {
    // A plain prompt rather than a dialog component: the reason is
    // optional and free-text, and a bespoke modal here would be the
    // fourth confirm-style dialog in the codebase for no added clarity.
    const note = window.prompt('سبب الرفض (اختياري):') ?? undefined
    setBusyId(action.id)
    try {
      await rejectAssistantAction(action.id, note)
      showToast('تم رفض الإجراء وإبلاغ المساعد')
      refetch()
    } catch {
      showToast('تعذر رفض الإجراء، حاول مرة أخرى', 'error')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <>
      <PageHeader
        title={isReviewer ? 'طلبات المساعدين' : 'طلباتي'}
        description={
          isReviewer
            ? 'كل إجراء قام به مساعدوك ولم يُنفَّذ بعد — راجعه ووافق عليه أو ارفضه'
            : 'الإجراءات اللي أرسلتها للمعلم وحالة كل واحدة منها'
        }
      />

      <div className="actions section">
        {STATUS_FILTERS.map((filter) => (
          <button
            key={filter.value}
            type="button"
            className={`chip clickable outline${status === filter.value ? ' selected' : ''}`}
            aria-pressed={status === filter.value}
            onClick={() => setStatus(filter.value)}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <SearchField
        id="assistant-actions-search"
        label="بحث في الطلبات"
        placeholder={isReviewer ? 'ابحث بالإجراء أو اسم المساعد...' : 'ابحث بالإجراء...'}
        value={list.query}
        onChange={list.search}
      />

      {isLoading && <LoadingState variant="list" />}

      {!isLoading && error && (
        <ErrorState
          title="تعذر تحميل الطلبات"
          message="لم نتمكن من تحميل قائمة الطلبات، جرب مرة أخرى."
          onRetry={refetch}
        />
      )}

      {!isLoading && !error && data.length === 0 && (
        <EmptyState
          fullPage
          title={isReviewer ? 'لا توجد طلبات' : 'لم ترسل أي طلبات بعد'}
          message={
            isReviewer
              ? 'مفيش إجراءات بانتظار مراجعتك حاليًا'
              : 'أي تعديل تعمله هيظهر هنا لحد ما المعلم يوافق عليه'
          }
        />
      )}

      {!isLoading && !error && list.isEmptyResult && (
        <EmptyState
          fullPage
          title="لا توجد نتائج"
          message="مفيش طلبات مطابقة لبحثك، جرّب كلمة تانية"
        />
      )}

      {!isLoading && !error && list.pageItems.length > 0 && (
        <div className="list">
          {list.pageItems.map((action) => {
            const badge = STATUS_CHIP[action.status] ?? STATUS_CHIP.pending
            return (
              <div key={action.id} className="list-item">
                <span className={`lead ${badge.chip}`}>
                  <span className="ms">{badge.icon}</span>
                </span>

                <span className="body">
                  <span className="t">{action.summary}</span>
                  <span className="s">
                    {isReviewer && `${action.assistantName} · `}
                    {formatDateTime(action.createdAt)}
                  </span>
                  {action.reviewNote && (
                    <span className="s" style={{ color: 'var(--danger-text)' }}>
                      سبب الرفض: {action.reviewNote}
                    </span>
                  )}
                  {action.executionError && (
                    <span className="s" style={{ color: 'var(--error)' }}>
                      تعذر التنفيذ: {action.executionError}
                    </span>
                  )}
                </span>

                <span className="end">
                  <span className={`chip ${badge.chip}`}>{badge.label}</span>

                  {isReviewer && action.status === 'pending' && (
                    <>
                      <button
                        type="button"
                        className="btn btn-compact"
                        disabled={busyId === action.id}
                        onClick={() => void handleApprove(action)}
                      >
                        <span className="ms sm">check</span>
                        موافقة
                      </button>
                      <button
                        type="button"
                        className="btn text"
                        disabled={busyId === action.id}
                        onClick={() => void handleReject(action)}
                        style={{ color: 'var(--danger-text)' }}
                      >
                        رفض
                      </button>
                    </>
                  )}
                </span>
              </div>
            )
          })}
        </div>
      )}

      {list.hasPages && (
        <Pagination
          page={list.page}
          totalPages={list.totalPages}
          onPageChange={list.setPage}
          matchCount={list.matchCount}
          pageSize={PAGE_SIZE}
          itemLabel="طلب"
        />
      )}
    </>
  )
}
