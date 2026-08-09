import { Link } from 'react-router'
import { User } from 'lucide-react'
import { EmptyState } from '../../../shared/components/EmptyState'
import { ErrorState } from '../../../shared/components/ErrorState'
import { LoadingState } from '../../../shared/components/LoadingState'
import { CourseThumb } from '../../courses/components/CourseThumb'
import { useCourseCatalog } from '../../courses/hooks/useCourseCatalog'

function formatMoney(minor: number, currency: string) {
  const amount = (minor / 100).toLocaleString('ar-EG')
  const label = currency === 'EGP' ? 'ج.م' : currency
  return `${amount} ${label}`
}

export function StudentBrowseCoursesPage() {
  const { data, isLoading, error, refetch } = useCourseCatalog()

  return (
    <>
      <div className="browse-header">
        <h1 className="page-title">استكشف الدورات</h1>
        <p className="subtitle">كل الدورات المتاحة للاشتراك</p>
      </div>

      {isLoading && <LoadingState variant="cards" />}

      {!isLoading && error && (
        <ErrorState
          title="تعذر تحميل الدورات"
          message="حدث خطأ أثناء تحميل الدورات المتاحة، يرجى المحاولة مرة أخرى"
          onRetry={refetch}
        />
      )}

      {!isLoading && !error && data.length === 0 && (
        <EmptyState
          variant="courses"
          title="لا توجد دورات متاحة حاليًا"
          message="لسه مفيش دورات منشورة، راجع لاحقًا"
          fullPage
        />
      )}

      {!isLoading && !error && data.length > 0 && (
        <div className="grid-3 course-browse-grid">
          {data.map((course) => (
            <article key={course.id} className="card lift course-browse-card">
              <div className="course-card-thumb-wrapper">
                <CourseThumb coverImageUrl={course.coverImageUrl} alt={course.title} />
                {course.gradeLevel && (
                  <span className="course-card-badge">{course.gradeLevel}</span>
                )}
              </div>

              <div className="course-card-body">
                <h3 className="course-card-title" title={course.title}>
                  {course.title}
                </h3>

                <div className="course-card-teacher">
                  <User className="teacher-icon" size={15} />
                  <span>{course.teacherName}</span>
                </div>

                <div className="course-card-footer">
                  {course.isEnrolled ? (
                    <>
                      <span className="course-enrolled-tag">مشترك بالفعل</span>
                      <Link
                        className="btn tonal btn-compact course-card-action"
                        to={`/student/courses/${course.id}`}
                      >
                        <span className="ms sm" aria-hidden="true">play_arrow</span>
                        متابعة الدورة
                      </Link>
                    </>
                  ) : (
                    <>
                      <div className="course-card-price">
                        <span className="price-amount">
                          {formatMoney(course.priceMinor, course.currency)}
                        </span>
                      </div>
                      <Link
                        className="btn btn-compact course-card-action"
                        to={`/student/checkout/${course.id}`}
                      >
                        <span className="ms sm" aria-hidden="true">shopping_cart</span>
                        شراء
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  )
}

