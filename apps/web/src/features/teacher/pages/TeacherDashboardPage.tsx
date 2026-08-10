import { Link } from 'react-router'
import { EmptyState } from '../../../shared/components/EmptyState'
import { ErrorState } from '../../../shared/components/ErrorState'
import { ForbiddenState } from '../../../shared/components/ForbiddenState'
import { COURSE_STATUS } from '../../../shared/lib/status-labels'
import { ROUTE_PATHS } from '../../../app/routes/route-paths'
import { useTeacherDashboard } from '../hooks/useTeacherDashboard'
import { TeacherDashboardSkeleton } from '../components/TeacherDashboardSkeleton'

export function TeacherDashboardPage() {
  const { data, isLoading, error } = useTeacherDashboard()

  if (isLoading) return <TeacherDashboardSkeleton />

  if (error) {
    if (error.status === 403) return <ForbiddenState />
    return <ErrorState />
  }

  if (!data) return <EmptyState />

  return (
    <>
      <h1 className="page-title">لوحة المعلم</h1>
      <p className="subtitle">نظرة عامة على دوراتك وطلابك</p>

      <div className="tiles section">
        <div className="tile">
          <span className="lead-ic">
            <span className="ms">library_books</span>
          </span>
          <span className="lbl">دوراتي</span>
          <span className="num">{data.stats.ownedCourseCount}</span>
        </div>

        <div className="tile">
          <span className="lead-ic">
            <span className="ms">public</span>
          </span>
          <span className="lbl">دورات منشورة</span>
          <span className="num">{data.stats.publishedCourseCount}</span>
        </div>

        <div className="tile">
          <span className="lead-ic">
            <span className="ms">group</span>
          </span>
          <span className="lbl">الطلاب المسجّلين</span>
          <span className="num">{data.stats.enrolledStudentCount}</span>
        </div>
      </div>

      <section className="section">
        <div className="section-head">
          <h2>أحدث الدورات</h2>
          <Link to={ROUTE_PATHS.TEACHER.COURSES} className="see-all">
            عرض الكل
            <span className="ms">chevron_left</span>
          </Link>
        </div>

        {data.recentCourses.length === 0 ? (
          <EmptyState
            variant="courses"
            title="لسه معندكش دورات"
            message="الدورات اللي بتديرها هتظهر هنا"
          />
        ) : (
          <div className="list">
            {data.recentCourses.map((course) => {
              const status = COURSE_STATUS[course.status]

              return (
                <Link key={course.id} to={`/teacher/courses/${course.id}`} className="list-item">
                  <span className="lead">
                    <span className="ms">menu_book</span>
                  </span>
                  <span className="body">
                    <span className="t">{course.title}</span>
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
