import { Link, useNavigate } from 'react-router'
import { EmptyState } from '../../../shared/components/EmptyState'
import { ErrorState } from '../../../shared/components/ErrorState'
import { ForbiddenState } from '../../../shared/components/ForbiddenState'
import { LoadingState } from '../../../shared/components/LoadingState'
import { ENROLLMENT_STATUS } from '../../../shared/lib/status-labels'
import { useStudentDashboard } from '../hooks/useStudentDashboard'

export function StudentDashboardPage() {
  const navigate = useNavigate()
  const { data, isLoading, error } = useStudentDashboard()

  if (isLoading) return <LoadingState variant="cards" />

  if (error) {
    if (error.status === 403) return <ForbiddenState />
    return <ErrorState />
  }

  if (!data) return <EmptyState />

  return (
    <>
      <h1 className="page-title">أهلاً، {data.student.fullName}</h1>
      <p className="subtitle">نظرة سريعة على دوراتك وتقدمك</p>

      <div className="tiles section">
        <div className="tile">
          <span className="lead-ic">
            <span className="ms">menu_book</span>
          </span>
          <span className="lbl">الدورات المسجّلة</span>
          <span className="num">{data.stats.enrolledCoursesCount}</span>
        </div>

        <div className="tile">
          <span className="lead-ic">
            <span className="ms">play_circle</span>
          </span>
          <span className="lbl">دورات نشطة</span>
          <span className="num">{data.stats.activeCoursesCount}</span>
        </div>

        {/* Progress tracking isn't built yet (Sprint 1 boundary). Showing a
            disabled, clearly-labelled tile rather than a fake number —
            sprint2-plan.md §13: "Do not fake it". */}
        <div className="tile" aria-disabled="true" style={{ opacity: 0.6 }}>
          <span className="lead-ic">
            <span className="ms">monitoring</span>
          </span>
          <span className="lbl">نسبة التقدم</span>
          <span className="num">—</span>
          <span className="sub">غير متاحة بعد</span>
        </div>

        <div className="tile" aria-disabled="true" style={{ opacity: 0.6 }}>
          <span className="lead-ic">
            <span className="ms">resume</span>
          </span>
          <span className="lbl">تابع التعلّم</span>
          <span className="num">—</span>
          <span className="sub">لم تبدأ بعد</span>
        </div>
      </div>

      <section className="section">
        <div className="section-head">
          <h2>أحدث دوراتك</h2>
          <Link to="/student/courses" className="see-all">
            عرض الكل
            <span className="ms">chevron_left</span>
          </Link>
        </div>

        {data.recentCourses.length === 0 ? (
          <EmptyState
            variant="courses"
            title="لسه مفيش دورات"
            message="لما تنضم لدورة هتظهر هنا"
            actionLabel="استكشف الدورات"
            onAction={() => navigate('/student/browse')}
          />
        ) : (
          <div className="list">
            {data.recentCourses.map((course) => {
              const status = ENROLLMENT_STATUS[course.status]

              return (
                <Link
                  key={course.courseId}
                  to={`/student/courses/${course.courseId}`}
                  className="list-item"
                >
                  <span className="lead">
                    <span className="ms">menu_book</span>
                  </span>

                  <span className="body">
                    <span className="t">{course.courseTitle ?? 'دورة غير متاحة'}</span>
                    <span className="s">
                      انضممت في {new Date(course.enrolledAt).toLocaleDateString('ar-EG')}
                    </span>
                  </span>

                  <span className="end">
                    <span className={`chip ${status.chip}`}>{status.label}</span>
                  </span>
                </Link>
              )
            })}
          </div>
        )}
      </section>
    </>
  )
}
