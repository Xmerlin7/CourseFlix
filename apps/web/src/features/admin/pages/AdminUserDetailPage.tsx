import { useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { ApiError } from '../../../shared/api/api-error'
import { ErrorState } from '../../../shared/components/ErrorState'
import { LoadingState } from '../../../shared/components/LoadingState'
import { NotFoundState } from '../../../shared/components/NotFoundState'
import { PageHeader } from '../../../shared/components/PageHeader'
import { ConfirmModal } from '../../../shared/components/ConfirmModal'
import { showToast } from '../../../shared/components/Toast'
import { ROUTE_PATHS } from '../../../app/routes/route-paths'
import { USER_ROLE_LABEL, USER_STATUS_LABEL } from '../lib/user-labels'
import { useAdminUserDetail } from '../hooks/useAdminUserDetail'
import { useAdminQuotas } from '../../teacher-billing/hooks/useAdminQuotas'
import { TopUpQuotaModal } from '../../teacher-billing/components/TopUpQuotaModal'
import { AdminSendNotificationForm } from '../components/AdminSendNotificationForm'
import {
  hardDeleteAdminUser,
  softDeleteAdminUser,
  updateAdminUser,
  updateAdminUserRole,
  updateAdminUserStatus,
} from '../api/admin-users.api'
import type { UserRole } from '../../auth/types/auth.types'
import type { UserStatus } from '../types/admin.types'

function getServerMessage(error: ApiError): string | null {
  const details = error.details
  if (details && typeof details === 'object' && 'message' in details) {
    const message = (details as { message?: unknown }).message
    return typeof message === 'string' ? message : null
  }
  return null
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' })
}

export function AdminUserDetailPage() {
  const { userId } = useParams<{ userId: string }>()
  const navigate = useNavigate()
  const { data, isLoading, error, refetch } = useAdminUserDetail(userId ?? '')
  const isTeacher = data?.role === 'teacher' && !!userId
  const { data: quotas, refetch: refetchQuotas } = useAdminQuotas(isTeacher)
  const teacherQuota = quotas?.find((quota) => quota.teacherId === userId) ?? null
  const [isTopUpOpen, setIsTopUpOpen] = useState(false)

  const [fullName, setFullName] = useState('')
  const [isSyncedName, setIsSyncedName] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  // Controls which delete modal is open (null = closed).
  const [deleteTarget, setDeleteTarget] = useState<'soft' | 'hard' | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Sync the editable field from freshly loaded data exactly once per
  // load — avoids clobbering in-progress edits on an unrelated refetch.
  if (data && !isSyncedName) {
    setFullName(data.fullName)
    setIsSyncedName(true)
  }

  async function withAction<T>(action: () => Promise<T>): Promise<T | null> {
    setIsSaving(true)
    setActionError(null)
    try {
      const result = await action()
      refetch()
      return result
    } catch (err) {
      setActionError(
        err instanceof ApiError
          ? (getServerMessage(err) ?? 'حدث خطأ ما، حاول مرة أخرى')
          : 'حدث خطأ ما، حاول مرة أخرى',
      )
      return null
    } finally {
      setIsSaving(false)
    }
  }

  async function handleSaveProfile() {
    if (!userId) return
    await withAction(() => updateAdminUser(userId, { fullName }))
  }

  const [targetRole, setTargetRole] = useState<UserRole | null>(null)

  function handleRoleChange(role: UserRole) {
    setTargetRole(role)
  }

  async function handleConfirmRoleChange() {
    if (!userId || !targetRole) return
    const roleToSet = targetRole
    setTargetRole(null)
    const result = await withAction(() => updateAdminUserRole(userId, roleToSet))
    if (result) {
      showToast('تم تغيير دور المستخدم بنجاح', 'success')
    }
  }

  async function handleStatusChange(status: UserStatus) {
    if (!userId) return
    await withAction(() => updateAdminUserStatus(userId, status))
  }

  async function handleDeleteConfirm() {
    if (!userId || isDeleting) return

    setIsDeleting(true)
    setActionError(null)

    try {
      if (deleteTarget === 'hard') {
        await hardDeleteAdminUser(userId)
      } else {
        await softDeleteAdminUser(userId)
      }
      setDeleteTarget(null)
      showToast('تم حذف الطالب بنجاح', 'success')
      navigate(ROUTE_PATHS.ADMIN.USERS)
    } catch (err) {
      setDeleteTarget(null)
      setIsDeleting(false)
      showToast('حدث خطأ أثناء حذف الطالب. حاول مرة أخرى.', 'error')
      setActionError(
        err instanceof ApiError ? (getServerMessage(err) ?? 'حدث خطأ ما، حاول مرة أخرى') : 'حدث خطأ ما، حاول مرة أخرى',
      )
    }
  }

  if (!userId) return <NotFoundState />
  if (isLoading) return <LoadingState variant="text" />
  if (error) {
    return (
      <ErrorState
        title="تعذر تحميل المستخدم"
        message="لم نتمكن من تحميل بيانات هذا المستخدم."
        onRetry={refetch}
      />
    )
  }
  if (!data) return <NotFoundState />

  const roleLabel = USER_ROLE_LABEL[data.role]
  const statusLabel = USER_STATUS_LABEL[data.status]
  const hasDependents =
    data.dependentRecordCounts.coursesTaught > 0 ||
    data.dependentRecordCounts.enrollments > 0 ||
    data.dependentRecordCounts.orders > 0

  return (
    <>
      <PageHeader
        title={data.fullName}
        description={
          data.role === 'assistant' && data.managedByTeacherName
            ? `${data.email} — يساعد: ${data.managedByTeacherName}`
            : data.email
        }
        badges={
          <>
            <span className={`chip ${roleLabel.chip}`}>{roleLabel.label}</span>
            <span className={`chip ${statusLabel.chip}`}>{statusLabel.label}</span>
          </>
        }
      />

      <div className="grid-3 section">
        <div className="tile">
          <span className="lead-ic">
            <span className="ms">menu_book</span>
          </span>
          <span className="lbl">دورات يُدرّسها</span>
          <span className="num">{data.dependentRecordCounts.coursesTaught}</span>
        </div>
        <div className="tile">
          <span className="lead-ic">
            <span className="ms">how_to_reg</span>
          </span>
          <span className="lbl">تسجيلات</span>
          <span className="num">{data.dependentRecordCounts.enrollments}</span>
        </div>
        <div className="tile">
          <span className="lead-ic">
            <span className="ms">receipt_long</span>
          </span>
          <span className="lbl">طلبات شراء</span>
          <span className="num">{data.dependentRecordCounts.orders}</span>
        </div>
      </div>

      {isTeacher && (
        <div className="card section">
          <div className="profile-card-head">
            <h3 className="profile-card-title">حصة المساعد الذكي</h3>
            <p className="profile-card-sub">
              رصيد الـ AI الشهري — الشحن يُضاف فوق الرصيد الحالي
            </p>
          </div>

          {teacherQuota ? (
            <>
              <div className="quota-numbers">
                <div className="tile">
                  <span className="lead-ic">
                    <span className="ms">bolt</span>
                  </span>
                  <span className="lbl">متبقي</span>
                  <span className="num">
                    <bdi>{teacherQuota.remainingCredits}</bdi>
                  </span>
                </div>
                <div className="tile">
                  <span className="lead-ic">
                    <span className="ms">all_inbox</span>
                  </span>
                  <span className="lbl">رصيد الشهر</span>
                  <span className="num">
                    <bdi>{teacherQuota.totalCredits}</bdi>
                  </span>
                </div>
                <div className="tile">
                  <span className="lead-ic">
                    <span className="ms">account_balance_wallet</span>
                  </span>
                  <span className="lbl">مستخدم</span>
                  <span className="num">
                    <bdi>{teacherQuota.usedCredits}</bdi>
                  </span>
                </div>
              </div>

              <div className="progress quota-progress" aria-hidden="true">
                <div className="bar" style={{ width: `${teacherQuota.percentUsed}%` }} />
              </div>
              <p className="meta">
                استهلك المعلم <bdi>{teacherQuota.percentUsed}%</bdi> من رصيده — بيتجدد أول كل شهر
              </p>
            </>
          ) : (
            <p className="meta">لا توجد حصة لهذا المعلم بعد — الشحن هيُنشئها تلقائياً.</p>
          )}

          <div className="actions" style={{ marginTop: 12 }}>
            <button
              type="button"
              className="btn"
              disabled={isSaving}
              onClick={() => setIsTopUpOpen(true)}
            >
              <span className="ms">add_card</span>
              شحن الحصة
            </button>
          </div>
        </div>
      )}

      <div className="detail-grid section">
        <form
          onSubmit={(event) => {
            event.preventDefault()
            void handleSaveProfile()
          }}
          className="card"
        >
          <div className="tf">
            <label htmlFor="admin-user-name">الاسم الكامل</label>
            <input
              id="admin-user-name"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              minLength={2}
              maxLength={150}
              required
            />
          </div>

          <div className="tf">
            <label>تاريخ الإنشاء</label>
            <input value={formatDateTime(data.createdAt)} disabled readOnly />
          </div>

          <div className="tf">
            <label>آخر دخول</label>
            <input value={data.lastLoginAt ? formatDateTime(data.lastLoginAt) : 'لم يسجل دخول بعد'} disabled readOnly />
          </div>

          {actionError && (
            <p role="alert" style={{ color: 'var(--error)', fontSize: 13.5, fontWeight: 600 }}>
              {actionError}
            </p>
          )}

          <div className="actions">
            <button type="submit" disabled={isSaving} className="btn">
              <span className="ms">save</span>
              {isSaving ? 'جارٍ الحفظ...' : 'حفظ التعديلات'}
            </button>
          </div>
        </form>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          <div className="card">
            <div className="tf">
              <label htmlFor="admin-user-role">الدور</label>
              <select
                id="admin-user-role"
                value={data.role}
                disabled={isSaving}
                onChange={(event) => void handleRoleChange(event.target.value as UserRole)}
              >
                {/* Assistants aren't a selectable target here (see
                    UpdateUserRoleDto) — they're only created via the
                    dedicated "مساعد جديد" flow. This option exists purely
                    so the select displays the current value correctly;
                    picking one of the other three demotes the assistant. */}
                {data.role === 'assistant' && (
                  <option value="assistant" disabled>
                    {USER_ROLE_LABEL.assistant.label}
                  </option>
                )}
                {(['student', 'teacher', 'admin'] as const).map((role) => (
                  <option key={role} value={role}>
                    {USER_ROLE_LABEL[role].label}
                  </option>
                ))}
              </select>
            </div>

            <div className="tf">
              <label htmlFor="admin-user-status">الحالة</label>
              <select
                id="admin-user-status"
                value={data.status}
                disabled={isSaving}
                onChange={(event) => void handleStatusChange(event.target.value as UserStatus)}
              >
                {(['active', 'suspended', 'inactive'] as const).map((status) => (
                  <option key={status} value={status}>
                    {USER_STATUS_LABEL[status].label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="card">
            <h3 style={{ marginBottom: 0 }}>التواصل</h3>
            <AdminSendNotificationForm
              targetUserId={data.id}
              targetLabel={data.fullName}
              relatedEntityType="user"
              relatedEntityId={data.id}
            />
          </div>

          <div className="card" style={{ borderColor: 'var(--error)' }}>
            <h3 style={{ marginBottom: 4 }}>منطقة خطر</h3>
            <p className="meta">
              {hasDependents
                ? 'لهذا المستخدم بيانات مرتبطة — الحذف النهائي لن ينجح إلا بعد إزالتها. استخدم الحذف العادي بدلاً من ذلك.'
                : 'لا توجد بيانات مرتبطة بهذا المستخدم — الحذف النهائي سينجح.'}
            </p>
            <div className="actions">
              <button type="button" disabled={isSaving} className="btn text" onClick={() => setDeleteTarget('soft')}>
                <span className="ms">delete</span>
                حذف المستخدم
              </button>
              <button type="button" disabled={isSaving} className="btn text" onClick={() => setDeleteTarget('hard')}>
                <span className="ms">delete_forever</span>
                حذف نهائي
              </button>
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal
        open={deleteTarget === 'soft'}
        title="حذف الطالب"
        message="هل أنت متأكد من حذف هذا الطالب؟ لا يمكن التراجع عن هذا الإجراء."
        confirmLabel="حذف الطالب"
        cancelLabel="إلغاء"
        isLoading={isDeleting}
        variant="danger"
        onConfirm={() => void handleDeleteConfirm()}
        onCancel={() => setDeleteTarget(null)}
      />

      <ConfirmModal
        open={deleteTarget === 'hard'}
        title="حذف نهائي"
        message="حذف نهائي لا يمكن التراجع عنه. سينجح فقط إذا لم يكن للمستخدم أي بيانات مرتبطة (دورات، تسجيلات، طلبات). متأكد؟"
        confirmLabel="حذف نهائي"
        cancelLabel="إلغاء"
        isLoading={isDeleting}
        variant="danger"
        onConfirm={() => void handleDeleteConfirm()}
        onCancel={() => setDeleteTarget(null)}
      />
      <ConfirmModal
        open={targetRole !== null}
        title="تغيير دور المستخدم"
        message={`هل أنت متأكد من تغيير دور المستخدم إلى "${targetRole ? USER_ROLE_LABEL[targetRole].label : ''}"؟`}
        confirmLabel="تأكيد التغيير"
        cancelLabel="إلغاء"
        isLoading={isSaving}
        onConfirm={() => void handleConfirmRoleChange()}
        onCancel={() => setTargetRole(null)}
      />

      <TopUpQuotaModal
        open={isTopUpOpen}
        teacherId={data.id}
        teacherName={data.fullName}
        quota={teacherQuota}
        onSuccess={refetchQuotas}
        onClose={() => setIsTopUpOpen(false)}
      />
    </>
  )
}
