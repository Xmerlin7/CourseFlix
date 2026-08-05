import { Link } from 'react-router'
import { EmptyState } from '../../../shared/components/EmptyState'
import { ErrorState } from '../../../shared/components/ErrorState'
import { LoadingState } from '../../../shared/components/LoadingState'
import { CourseThumb } from '../../courses/components/CourseThumb'
import { useCourseCatalog } from '../../courses/hooks/useCourseCatalog'

function formatMoney(minor: number, currency: string) {
  return `${(minor / 100).toLocaleString('ar-EG')} ${currency}`
}

export function StudentBrowseCoursesPage() {
  const { data, isLoading, error, refetch } = useCourseCatalog()

  return (
    <>
      <h1 className="page-title">استكشف الدورات</h1>
      <p className="subtitle">كل الدورات المتاحة للاشتراك</p>

      {isLoading && <LoadingState variant="cards" />}

      {!isLoading && error && <ErrorState onRetry={refetch} />}

      {!isLoading && !error && data.length === 0 && (
        <EmptyState
          variant="courses"
          title="لا توجد دورات متاحة حاليًا"
          message="لسه مفيش دورات منشورة، راجع لاحقًا"
        />
      )}

      {!isLoading && !error && data.length > 0 && (
        <div className="grid-3">
          {data.map((course) => (
            <div key={course.id} className="card lift course-card">
              <div className="row">
                <CourseThumb coverImageUrl={course.coverImageUrl} alt={course.title} />

                <div className="info">
                  <h3>{course.title}</h3>
                  <span className="meta">
                    {[course.teacherName, course.gradeLevel].filter(Boolean).join(' · ')}
                  </span>
                  <div className="actions">
                    {course.isEnrolled ? (
                      <Link className="btn tonal" to={`/student/courses/${course.id}`}>
                        <span className="ms">play_arrow</span>
                        متابعة الدورة
                      </Link>
                    ) : (
                      <Link className="btn" to={`/student/checkout/${course.id}`}>
                        <span className="ms">shopping_cart</span>
                        شراء بـ {formatMoney(course.priceMinor, course.currency)}
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
