import { useCallback } from 'react'
import { Link } from 'react-router'
import { EmptyState } from '../../../shared/components/EmptyState'
import { ErrorState } from '../../../shared/components/ErrorState'
import { LoadingState } from '../../../shared/components/LoadingState'
import { PageHeader } from '../../../shared/components/PageHeader'
import { Pagination } from '../../../shared/components/Pagination'
import { SearchField } from '../../../shared/components/SearchField'
import { usePaginatedList } from '../../../shared/hooks/usePaginatedList'
import { useAdminQuizzes } from '../hooks/useAdminQuizzes'
import type { AdminQuizListItem } from '../types/admin.types'

const PAGE_SIZE = 10

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' })
}

export function AdminQuizzesPage() {
  const { data, isLoading, error, refetch } = useAdminQuizzes({})

  const toHaystack = useCallback(
    (quiz: AdminQuizListItem) => `${quiz.title} ${quiz.courseTitle}`,
    [],
  )
  const list = usePaginatedList(data, toHaystack, PAGE_SIZE)

  return (
    <>
      <PageHeader title="الاختبارات" description="كل الاختبارات على المنصة" />

      <SearchField
        id="admin-quizzes-search"
        label="بحث في الاختبارات"
        placeholder="ابحث باسم الاختبار أو الدورة..."
        value={list.query}
        onChange={list.search}
      />

      {isLoading && <LoadingState variant="list" />}

      {!isLoading && error && (
        <ErrorState
          title="تعذر تحميل الاختبارات"
          message="لم نتمكن من تحميل قائمة الاختبارات، جرب مرة أخرى."
          onRetry={refetch}
        />
      )}

      {!isLoading && !error && data && data.length === 0 && (
        <EmptyState fullPage title="لا توجد اختبارات" message="مفيش اختبارات على المنصة حاليًا" />
      )}

      {!isLoading && !error && list.isEmptyResult && (
        <EmptyState fullPage title="لا توجد نتائج" message="مفيش نتائج مطابقة لبحثك، جرّب كلمة تانية" />
      )}

      {!isLoading && !error && list.pageItems.length > 0 && (
        <div className="table-wrap section">
          <table className="mtable">
            <thead>
              <tr>
                <th>الاختبار</th>
                <th>الدورة</th>
                <th>تاريخ الإنشاء</th>
              </tr>
            </thead>
            <tbody>
              {list.pageItems.map((quiz) => (
                <tr key={quiz.id}>
                  <td>
                    <Link to={`/admin/quizzes/${quiz.id}`}>
                      <strong>{quiz.title}</strong>
                    </Link>
                  </td>
                  <td>{quiz.courseTitle}</td>
                  <td>{formatDate(quiz.createdAt)}</td>
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
          itemLabel="اختبار"
        />
      )}
    </>
  )
}
