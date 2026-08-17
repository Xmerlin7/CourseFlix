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
import { COURSE_STATUS } from '../../../shared/lib/status-labels'
import { useAdminCourses } from '../hooks/useAdminCourses'
import type { CourseStatus } from '../../courses/types/course.types'

type StatusFilter = CourseStatus | 'all'

const PAGE_SIZE = 10

/** The endpoint filters; usePaginatedList must not filter again. */
const NO_CLIENT_FILTER = () => ''

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' })
}

export function AdminCoursesPage() {
  const [status, setStatus] = useState<StatusFilter>('all')
  const [search, setSearch] = useState('')

  // Debounced for the same reason as AdminUsersPage: the endpoint does
  // the filtering, so an un-debounced term is one request per keystroke.
  const debouncedSearch = useDebouncedValue(search)

  const { data, isLoading, error, refetch } = useAdminCourses({
    status: status === 'all' ? undefined : status,
    search: debouncedSearch.trim() || undefined,
  })

  // `search` is applied by the endpoint (it matches fields the client
  // never receives), so the hook only paginates here — hence the fourth
  // argument and the no-op haystack.
  const list = usePaginatedList(data, NO_CLIENT_FILTER, PAGE_SIZE, debouncedSearch)

  return (
    <>
      <PageHeader title="الدورات" description="كل الدورات على المنصة، بغض النظر عن المعلم" />

      <div className="actions section">
        {(['all', 'draft', 'published', 'archived'] as const).map((option) => (
          <button
            key={option}
            type="button"
            className={`chip clickable outline${status === option ? ' selected' : ''}`}
            aria-pressed={status === option}
            onClick={() => setStatus(option)}
          >
            {option === 'all' ? 'كل الحالات' : COURSE_STATUS[option].label}
          </button>
        ))}
      </div>

      <SearchField
        id="admin-courses-search"
        label="بحث بعنوان الدورة"
        placeholder="اكتب عنوان الدورة..."
        value={search}
        onChange={setSearch}
      />

      {isLoading && <LoadingState variant="list" />}

      {!isLoading && error && (
        <ErrorState
          title="تعذر تحميل الدورات"
          message="لم نتمكن من تحميل قائمة الدورات، جرب مرة أخرى."
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
                <th>الدورة</th>
                <th>المعلم</th>
                <th>الحالة</th>
                <th>الصف الدراسي</th>
                <th>تاريخ الإنشاء</th>
              </tr>
            </thead>
            <tbody>
              {list.pageItems.map((course) => {
                const statusLabel = COURSE_STATUS[course.status]
                return (
                  <tr key={course.id}>
                    <td>
                      <Link to={`/admin/courses/${course.id}`}>
                        <strong>{course.title}</strong>
                      </Link>
                    </td>
                    <td>{course.teacherName}</td>
                    <td>
                      <span className={`chip ${statusLabel.chip}`}>{statusLabel.label}</span>
                    </td>
                    <td>{course.gradeLevel ?? '—'}</td>
                    <td>{formatDate(course.createdAt)}</td>
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
          itemLabel="دورة"
        />
      )}
    </>
  )
}
