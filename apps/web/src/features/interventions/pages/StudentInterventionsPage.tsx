import { useCallback } from 'react'
import { Link } from 'react-router'
import { EmptyState } from '../../../shared/components/EmptyState'
import { ErrorState } from '../../../shared/components/ErrorState'
import { Pagination } from '../../../shared/components/Pagination'
import { SearchField } from '../../../shared/components/SearchField'
import { usePaginatedList } from '../../../shared/hooks/usePaginatedList'
import { ForbiddenState } from '../../../shared/components/ForbiddenState'
import { useStudentInterventions } from '../hooks/useStudentInterventions'
import { StudentInterventionsSkeleton } from '../components/StudentInterventionsSkeleton'
import type { InterventionRuleKey } from '../types/intervention.types'

const RULE_LABEL: Record<InterventionRuleKey, string> = {
  low_quiz_score: 'نتيجة اختبار منخفضة',
  explicit_confusion_phrase: 'صعوبة في الفهم',
  repeated_concept_question: 'سؤال متكرر',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ar-EG', { dateStyle: 'medium' })
}

const PAGE_SIZE = 10

export function StudentInterventionsPage() {
  const { data, isLoading, error, refetch } = useStudentInterventions()

  const toHaystack = useCallback(
    (intervention: (typeof data)[number]) =>
      Object.values(intervention)
        .filter((value): value is string => typeof value === 'string')
        .join(' '),
    [],
  )
  const list = usePaginatedList(data, toHaystack, PAGE_SIZE)

  return (
    <>
      <h1 className="page-title">نقاط تحتاج مراجعة</h1>
      <p className="subtitle">هنا هتلاقي أي نقطة رصدها النظام إنك محتاج تراجعها</p>

      <SearchField
        id="studentinterventions-search"
        label="بحث في التنبيهات"
        placeholder="ابحث في المفاهيم أو الدورات..."
        value={list.query}
        onChange={list.search}
      />

      {isLoading && <StudentInterventionsSkeleton />}

      {!isLoading &&
        error &&
        (error.status === 403 ? <ForbiddenState /> : <ErrorState onRetry={refetch} />)}

      {!isLoading && !error && data.length === 0 && (
        <EmptyState
          title="لا توجد نقاط تحتاج مراجعة"
          message="لسه معندكش أي نقطة محتاجة مراجعة — استمر في التقدم!"
        />
      )}

      {!isLoading && !error && list.isEmptyResult && (
        <EmptyState title="لا توجد نتائج" message="مفيش تنبيهات مطابقة لبحثك، جرّب كلمة تانية" />
      )}

      {!isLoading && !error && list.pageItems.length > 0 && (
        <div className="list">
          {list.pageItems.map((intervention) => (
            <div key={intervention.id} className="list-item">
              <span className="lead">
                <span className="ms">monitoring</span>
              </span>

              <span className="body">
                <span className="t">{intervention.weakConcept}</span>
                <span className="s">{RULE_LABEL[intervention.ruleKey]}</span>
              </span>

              <span className="end">
                {intervention.miniQuizId ? (
                  <Link
                    to={`/student/mini-quizzes/${intervention.miniQuizId}`}
                    className="chip outline green"
                  >
                    ابدأ الاختبار القصير
                  </Link>
                ) : (
                  <span className="chip outline">جاري تجهيز اختبار قصير</span>
                )}
                {formatDate(intervention.createdAt)}
              </span>
            </div>
          ))}
        </div>
      )}

      {list.hasPages && (
        <Pagination
          page={list.page}
          totalPages={list.totalPages}
          onPageChange={list.setPage}
          matchCount={list.matchCount}
          pageSize={PAGE_SIZE}
          itemLabel="تنبيه"
        />
      )}
    </>
  )
}
