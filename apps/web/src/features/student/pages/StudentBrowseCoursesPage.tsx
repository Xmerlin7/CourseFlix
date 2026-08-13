import { useCallback } from 'react'
import { Link } from 'react-router'
import { User } from 'lucide-react'
import { EmptyState } from '../../../shared/components/EmptyState'
import { Pagination } from '../../../shared/components/Pagination'
import { SearchField } from '../../../shared/components/SearchField'
import { usePaginatedList } from '../../../shared/hooks/usePaginatedList'
import { ErrorState } from '../../../shared/components/ErrorState'
import { CourseThumb } from '../../courses/components/CourseThumb'
import { useCourseCatalog } from '../../courses/hooks/useCourseCatalog'
import { StudentBrowseCoursesSkeleton } from '../components/StudentBrowseCoursesSkeleton'

const PAGE_SIZE = 9

function formatMoney(minor: number, currency: string) {
  const amount = (minor / 100).toLocaleString('ar-EG')
  const label = currency === 'EGP' ? 'ج.م' : currency
  return `${amount} ${label}`
}

export function StudentBrowseCoursesPage() {
  const { data, isLoading, error, refetch } = useCourseCatalog()

  const toHaystack = useCallback(
    (course: (typeof data)[number]) =>
      `${course.title} ${course.teacherName} ${course.gradeLevel ?? ''}`,
    [],
  )
  // Nine per page, not ten: the grid is three columns wide, so a
  // multiple of three is the only page size that never leaves a ragged
  // last row on desktop.
  const list = usePaginatedList(data, toHaystack, PAGE_SIZE)

  return (
    <>
      <div className="browse-header">
        <h1 className="page-title">استكشف الدورات</h1>
        <p className="subtitle">كل الدورات المتاحة للاشتراك</p>
      </div>

      <SearchField
        id="browse-courses-search"
        label="بحث في الدورات"
        placeholder="ابحث باسم الدورة أو المعلم أو الصف..."
        value={list.query}
        onChange={list.search}
      />

      {isLoading && <StudentBrowseCoursesSkeleton />}

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

      {!isLoading && !error && list.isEmptyResult && (
        <EmptyState
          variant="courses"
          title="لا توجد نتائج"
          message="مفيش دورات مطابقة لبحثك، جرّب كلمة تانية"
          fullPage
        />
      )}

      {!isLoading && !error && list.pageItems.length > 0 && (
        <div className="grid-3 course-browse-grid">
          {list.pageItems.map((course) => (
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

      {list.hasPages && (
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

