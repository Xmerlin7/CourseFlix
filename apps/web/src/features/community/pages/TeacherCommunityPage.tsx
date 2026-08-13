import { useCallback } from 'react'
import { Link } from 'react-router'
import { ErrorState } from '../../../shared/components/ErrorState'
import { Pagination } from '../../../shared/components/Pagination'
import { SearchField } from '../../../shared/components/SearchField'
import { usePaginatedList } from '../../../shared/hooks/usePaginatedList'
import { ROUTE_PATHS } from '../../../app/routes/route-paths'
import { CourseThumb } from '../../courses/components/CourseThumb'
import { useTeacherCourses } from '../../teacher/hooks/useTeacherCourses'
import type { TeacherCourse } from '../../teacher/types/teacher.types'
import { StudentCommunitySkeleton } from '../components/StudentCommunitySkeleton'

const PAGE_SIZE = 10

function buildCommunityPath(courseId: string): string {
  return ROUTE_PATHS.TEACHER.COMMUNITY_COURSE.replace(':courseId', courseId)
}

export function TeacherCommunityPage() {
  const { data: courses, isLoading, error, refetch } = useTeacherCourses()

  const toHaystack = useCallback((course: TeacherCourse) => course.title, [])
  const list = usePaginatedList(courses ?? [], toHaystack, PAGE_SIZE)

  if (isLoading) return <StudentCommunitySkeleton />

  return (
    <div className="community-page">
      <div className="community-page-header">
        <h1 className="page-title">المجتمع</h1>
        <p className="community-page-subtitle">
          تابع مناقشات دوراتك وانشر الإعلانات من مكان واحد
        </p>
      </div>

      {error ? (
        <ErrorState onRetry={refetch} />
      ) : courses.length === 0 ? (
        <div className="community-empty">
          <span className="ms" aria-hidden="true">groups</span>
          <p className="community-empty-title">لا توجد مجتمعات متاحة</p>
          <p className="community-empty-message">أنشئ دورة أو انشرها ليظهر مجتمعها هنا</p>
        </div>
      ) : (
        <>
          <SearchField
            id="teacher-community-search"
            label="بحث عن دورة"
            placeholder="ابحث باسم الدورة..."
            value={list.query}
            onChange={list.search}
          />

          {list.pageItems.length === 0 ? (
            <p className="community-no-results">مفيش دورات مطابقة لبحثك.</p>
          ) : (
            <div className="community-list">
              {list.pageItems.map((course) => (
                <TeacherCommunityCourseRow key={course.id} course={course} />
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
      )}
    </div>
  )
}

function TeacherCommunityCourseRow({ course }: { course: TeacherCourse }) {
  return (
    <Link to={buildCommunityPath(course.id)} className="community-row">
      <div className="community-row-avatar">
        <CourseThumb coverImageUrl={course.coverImageUrl} alt={course.title} />
      </div>

      <div className="community-row-main">
        <div className="community-row-line1">
          <span className="community-row-title">{course.title}</span>
          <span className="community-row-time">
            {course.status === 'published' ? 'منشورة' : 'مسودة'}
          </span>
        </div>

        {course.gradeLevel && (
          <div className="community-row-line2">
            <span className="community-row-grade">{course.gradeLevel}</span>
          </div>
        )}

        <div className="community-row-line3">
          <span className="community-row-preview">افتح المناقشات والإعلانات الخاصة بالدورة</span>
        </div>
      </div>
    </Link>
  )
}
