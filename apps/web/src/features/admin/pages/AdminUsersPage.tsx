import { useState } from 'react'
import { Link } from 'react-router'
import { EmptyState } from '../../../shared/components/EmptyState'
import { ErrorState } from '../../../shared/components/ErrorState'
import { LoadingState } from '../../../shared/components/LoadingState'
import { PageHeader } from '../../../shared/components/PageHeader'
import { Pagination } from '../../../shared/components/Pagination'
import { SearchField } from '../../../shared/components/SearchField'
import { usePaginatedList } from '../../../shared/hooks/usePaginatedList'
import { useDebouncedValue } from '../../../shared/hooks/useDebouncedValue'
import { ROUTE_PATHS } from '../../../app/routes/route-paths'
import { USER_ROLE_LABEL, USER_STATUS_LABEL } from '../lib/user-labels'
import { useAdminUsers } from '../hooks/useAdminUsers'
import { useAdminQuotas } from '../../teacher-billing/hooks/useAdminQuotas'
import type { UserRole } from '../../auth/types/auth.types'
import type { UserStatus } from '../types/admin.types'

type RoleFilter = UserRole | 'all'
type StatusFilter = UserStatus | 'all'

const PAGE_SIZE = 10

/** The endpoint filters; usePaginatedList must not filter again. */
const NO_CLIENT_FILTER = () => ''

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' })
}

export function AdminUsersPage() {
  const [role, setRole] = useState<RoleFilter>('all')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [search, setSearch] = useState('')

  // The endpoint does the searching, so the term is debounced before it
  // reaches the hook — otherwise every keystroke is its own request.
  const debouncedSearch = useDebouncedValue(search)

  const { data, isLoading, error, refetch } = useAdminUsers({
    role: role === 'all' ? undefined : role,
    status: status === 'all' ? undefined : status,
    search: debouncedSearch.trim() || undefined,
  })

  // Quota is a separate endpoint (admins only); joined client-side by
  // teacher id so the users list stays one source of truth.
  const { data: quotas } = useAdminQuotas()
  const quotaByTeacherId = new Map((quotas ?? []).map((quota) => [quota.teacherId, quota]))

  // `search` is applied by the endpoint (it matches fields the client
  // never receives), so the hook only paginates here — hence the fourth
  // argument and the no-op haystack.
  const list = usePaginatedList(data, NO_CLIENT_FILTER, PAGE_SIZE, debouncedSearch)

  return (
    <>
      <PageHeader
        title="المستخدمون"
        description="كل الطلاب والمعلمين والمساعدين والأدمنز على المنصة"
        actions={
          <>
            <Link to={ROUTE_PATHS.ADMIN.CREATE_TEACHER} className="btn tonal">
              <span className="ms">school</span>
              حساب المعلم
            </Link>
            <Link to={ROUTE_PATHS.ADMIN.CREATE_ASSISTANT} className="btn tonal">
              <span className="ms">group_add</span>
              مساعد جديد
            </Link>
            <Link to={ROUTE_PATHS.ADMIN.CREATE_ADMIN} className="btn">
              <span className="ms">person_add</span>
              أدمن جديد
            </Link>
          </>
        }
      />

      <div className="actions section" style={{ flexWrap: 'wrap', gap: 8 }}>
        {(['all', 'student', 'teacher', 'assistant', 'admin'] as const).map((option) => (
          <button
            key={option}
            type="button"
            className={`chip clickable outline${role === option ? ' selected' : ''}`}
            aria-pressed={role === option}
            onClick={() => setRole(option)}
          >
            {option === 'all' ? 'كل الأدوار' : USER_ROLE_LABEL[option].label}
          </button>
        ))}

        <span style={{ width: 1, alignSelf: 'stretch', background: 'var(--outline-variant)' }} />

        {(['all', 'active', 'suspended', 'inactive'] as const).map((option) => (
          <button
            key={option}
            type="button"
            className={`chip clickable outline${status === option ? ' selected' : ''}`}
            aria-pressed={status === option}
            onClick={() => setStatus(option)}
          >
            {option === 'all' ? 'كل الحالات' : USER_STATUS_LABEL[option].label}
          </button>
        ))}
      </div>

      <SearchField
        id="admin-users-search"
        label="بحث بالاسم أو البريد أو معرف تتبع الفيديو"
        placeholder="اسم، بريد إلكتروني، أو كود فيديو مسرّب..."
        value={search}
        onChange={setSearch}
      />

      {isLoading && <LoadingState variant="list" />}

      {!isLoading && error && (
        <ErrorState
          title="تعذر تحميل المستخدمين"
          message="لم نتمكن من تحميل قائمة المستخدمين، جرب مرة أخرى."
          onRetry={refetch}
        />
      )}

      {!isLoading && !error && data && data.length === 0 && (
        <EmptyState fullPage title="لا توجد نتائج" message="غيّر الفلاتر أو مصطلح البحث" />
      )}

      {!isLoading && !error && list.pageItems.length > 0 && (
        <div className="table-wrap section">
          <table className="mtable">
            <thead>
              <tr>
                <th>المستخدم</th>
                <th>ID</th>
                <th>الدور</th>
                <th>الحالة</th>
                <th>الحصة</th>
                <th>آخر دخول</th>
                <th>تاريخ الإنشاء</th>
              </tr>
            </thead>
            <tbody>
              {list.pageItems.map((user) => {
                const roleLabel = USER_ROLE_LABEL[user.role]
                const statusLabel = USER_STATUS_LABEL[user.status]
                const quota = quotaByTeacherId.get(user.id)
                return (
                  <tr key={user.id}>
                    <td>
                      <Link to={`/admin/users/${user.id}`}>
                        <strong>{user.fullName}</strong>
                      </Link>
                      <span className="meta" style={{ display: 'block' }}>
                        {user.email}
                      </span>
                    </td>
                    <td>
                      <code dir="ltr">{user.id}</code>
                    </td>
                    <td>
                      <span className={`chip ${roleLabel.chip}`}>{roleLabel.label}</span>
                    </td>
                    <td>
                      <span className={`chip ${statusLabel.chip}`}>{statusLabel.label}</span>
                    </td>
                    <td>
                      {quota ? (
                        <span
                          className={`chip ${quota.percentUsed >= 80 ? 'red' : 'outline'}`}
                          title={`المستخدم: ${quota.usedCredits} من ${quota.totalCredits} — متبقي ${quota.remainingCredits}`}
                        >
                          <bdi>
                            {quota.remainingCredits}/{quota.totalCredits}
                          </bdi>
                        </span>
                      ) : (
                        <span className="meta">—</span>
                      )}
                    </td>
                    <td>{user.lastLoginAt ? formatDate(user.lastLoginAt) : 'لم يسجل دخول بعد'}</td>
                    <td>{formatDate(user.createdAt)}</td>
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
          itemLabel="مستخدم"
        />
      )}
    </>
  )
}
