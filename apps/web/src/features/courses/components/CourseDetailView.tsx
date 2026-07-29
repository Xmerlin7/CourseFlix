import { EmptyState } from '../../../shared/components/EmptyState'
import { COURSE_STATUS } from '../../../shared/lib/status-labels'
import type { CourseDetail } from '../types/course.types'

interface CourseDetailViewProps {
  course: CourseDetail
}

/**
 * Shared student/teacher course-detail presentation. Both
 * StudentCourseDetailPage and TeacherCourseDetailPage render this against
 * the same GET /api/v1/courses/:courseId response — the owning teacher
 * additionally renders TeacherCourseForm alongside it.
 */
export function CourseDetailView({ course }: CourseDetailViewProps) {
  const lessonCount = course.sections.reduce(
    (total, section) => total + section.lessons.length,
    0,
  )
  const status = COURSE_STATUS[course.status]

  return (
    <>
      <div className="section-head">
        <div>
          <h1 className="page-title">{course.title}</h1>
          <p className="subtitle" style={{ marginBottom: 0 }}>
            {[course.gradeLevel, course.teacher.fullName, `${lessonCount} درسًا`]
              .filter(Boolean)
              .join(' · ')}
          </p>
        </div>
        <span className={`chip ${status.chip}`}>{status.label}</span>
      </div>

      {course.description && <p className="subtitle">{course.description}</p>}

      {course.sections.length === 0 ? (
        <EmptyState
          title="لسه مفيش محتوى في الدورة دي"
          message="لما يتم إضافة أقسام ودروس هتظهر هنا"
        />
      ) : (
        course.sections.map((section) => (
          <section key={section.id} className="section">
            <div className="section-head">
              <h2>{section.title}</h2>
            </div>

            {section.lessons.length === 0 ? (
              <p className="subtitle">لا يوجد دروس في هذا القسم بعد</p>
            ) : (
              <div className="list">
                {section.lessons.map((lesson) => (
                  // Deliberately not a link: the lesson player route is
                  // Albraa's slice and isn't in router.tsx yet, so this
                  // stays a plain row rather than a dead link to /404.
                  <div key={lesson.id} className="list-item">
                    <span className="lead">
                      <span className="ms">play_circle</span>
                    </span>
                    <span className="body">
                      <span className="t">{lesson.title}</span>
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        ))
      )}
    </>
  )
}
