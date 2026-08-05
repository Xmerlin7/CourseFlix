import { Link } from 'react-router'
import { EmptyState } from '../../../shared/components/EmptyState'
import { ErrorState } from '../../../shared/components/ErrorState'
import { ForbiddenState } from '../../../shared/components/ForbiddenState'
import { LoadingState } from '../../../shared/components/LoadingState'
import { useStudentInterventions } from '../hooks/useStudentInterventions'
import type { InterventionRuleKey } from '../types/intervention.types'

const RULE_LABEL: Record<InterventionRuleKey, string> = {
  low_quiz_score: 'نتيجة اختبار منخفضة',
  explicit_confusion_phrase: 'صعوبة في الفهم',
  repeated_concept_question: 'سؤال متكرر',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ar-EG', { dateStyle: 'medium' })
}

export function StudentInterventionsPage() {
  const { data, isLoading, error, refetch } = useStudentInterventions()

  return (
    <>
      <h1 className="page-title">نقاط تحتاج مراجعة</h1>
      <p className="subtitle">هنا هتلاقي أي نقطة رصدها النظام إنك محتاج تراجعها</p>

      {isLoading && <LoadingState variant="list" />}

      {!isLoading &&
        error &&
        (error.status === 403 ? <ForbiddenState /> : <ErrorState onRetry={refetch} />)}

      {!isLoading && !error && data.length === 0 && (
        <EmptyState
          title="لا توجد نقاط تحتاج مراجعة"
          message="لسه معندكش أي نقطة محتاجة مراجعة — استمر في التقدم!"
        />
      )}

      {!isLoading && !error && data.length > 0 && (
        <div className="list">
          {data.map((intervention) => (
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
    </>
  )
}
