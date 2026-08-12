import { EmptyState } from '../../../shared/components/EmptyState'
import { ErrorState } from '../../../shared/components/ErrorState'
import { ForbiddenState } from '../../../shared/components/ForbiddenState'
import { useTeacherInterventions } from '../hooks/useTeacherInterventions'
import { TeacherInterventionsSkeleton } from '../components/TeacherInterventionsSkeleton'
import type { InterventionRuleKey, InterventionStatus } from '../types/intervention.types'

const RULE_LABEL: Record<InterventionRuleKey, string> = {
  low_quiz_score: 'نتيجة اختبار منخفضة',
  explicit_confusion_phrase: 'صعوبة في الفهم',
  repeated_concept_question: 'سؤال متكرر',
}

const STATUS_LABEL: Record<InterventionStatus, string> = {
  active: 'نشط',
  resolved: 'تمت المتابعة',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ar-EG', { dateStyle: 'medium' })
}

export function TeacherInterventionsPage() {
  const { data, isLoading, error, refetch } = useTeacherInterventions()

  return (
    <>
      <h1 className="page-title">تقارير المتابعة</h1>
      <p className="subtitle">نقاط رصدها النظام لطلابك في دوراتك وتحتاج متابعة</p>

      {isLoading && <TeacherInterventionsSkeleton />}

      {!isLoading &&
        error &&
        (error.status === 403 ? <ForbiddenState /> : <ErrorState onRetry={refetch} />)}

      {!isLoading && !error && data.length === 0 && (
        <EmptyState
          title="لا توجد تقارير متابعة"
          message="هيظهر هنا أي طالب محتاج متابعة في دوراتك"
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
                <span className="t">{intervention.studentName}</span>
                <span className="s">
                  {intervention.weakConcept} — {RULE_LABEL[intervention.ruleKey]}
                </span>
              </span>

              <span className="end">
                <span className={`chip outline${intervention.status === 'active' ? ' pink' : ' green'}`}>
                  {STATUS_LABEL[intervention.status]}
                </span>
                {formatDate(intervention.createdAt)}
              </span>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
