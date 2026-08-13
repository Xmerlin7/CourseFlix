import { useCallback } from 'react'
import { Link } from 'react-router'
import { ErrorState } from '../../../shared/components/ErrorState'
import { LoadingState } from '../../../shared/components/LoadingState'
import { Pagination } from '../../../shared/components/Pagination'
import { SearchField } from '../../../shared/components/SearchField'
import { usePaginatedList } from '../../../shared/hooks/usePaginatedList'
import { useCourseQuizzes } from '../hooks/useCourseQuizzes'

interface StudentCourseQuizzesProps {
  courseId: string
}

const PAGE_SIZE = 10

export function StudentCourseQuizzes({ courseId }: StudentCourseQuizzesProps) {
  const { data, isLoading, error } = useCourseQuizzes(courseId)

  const toHaystack = useCallback((quiz: (typeof data)[number]) => quiz.title, [])
  const list = usePaginatedList(data, toHaystack, PAGE_SIZE)

  if (isLoading) {
    return (
      <section className="section">
        <div className="section-head">
          <h2>اختبارات الدورة</h2>
        </div>
        <LoadingState variant="list" />
      </section>
    )
  }

  if (error) {
    return (
      <section className="section">
        <div className="section-head">
          <h2>اختبارات الدورة</h2>
        </div>
        <ErrorState />
      </section>
    )
  }

  if (data.length === 0) {
    return null
  }

  return (
    <section className="section">
      <div className="section-head">
        <h2>اختبارات الدورة</h2>
      </div>

      <SearchField
        id="student-course-quizzes-search"
        label="بحث في الاختبارات"
        placeholder="ابحث باسم الاختبار..."
        value={list.query}
        onChange={list.search}
      />

      {list.isEmptyResult && (
        <p className="subtitle">مفيش اختبارات مطابقة لبحثك، جرّب كلمة تانية</p>
      )}

      <div className="list">
        {list.pageItems.map((quiz) => (
          <Link key={quiz.id} to={`/student/quizzes/${quiz.id}`} className="list-item">
            <span className="lead">
              <span className="ms">quiz</span>
            </span>
            <span className="body">
              <span className="t">{quiz.title}</span>
              <span className="s">
                {quiz.questionCount} سؤال
                {quiz.submission
                  ? ` - تم الحل: ${quiz.submission.score} / ${quiz.submission.total}`
                  : ' - جاهز للحل'}
                {quiz.dueAt && ` - آخر موعد: ${new Date(quiz.dueAt).toLocaleDateString('ar-EG')}`}
              </span>
            </span>
            <span className="end">
              <span className={`chip${quiz.submission ? ' green' : ''}`}>
                {quiz.submission ? 'تم الحل' : 'ابدأ'}
              </span>
            </span>
          </Link>
        ))}
      </div>

      {list.hasPages && (
        <Pagination
          page={list.page}
          totalPages={list.totalPages}
          onPageChange={list.setPage}
          matchCount={list.matchCount}
          pageSize={PAGE_SIZE}
          itemLabel="اختبار"
        />
      )}
    </section>
  )
}
