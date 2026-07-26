import { PlayCircle } from 'lucide-react'
import { EmptyState } from '../../../shared/components/EmptyState'
import { PageHeader } from '../../../shared/components/PageHeader'
import type { CourseDetail } from '../types/course.types'

interface CourseDetailViewProps {
  course: CourseDetail
}

const STATUS_LABELS: Record<CourseDetail['status'], string> = {
  draft: 'مسودة',
  published: 'منشورة',
  archived: 'مؤرشفة',
}

const STATUS_CHIP_CLASSES: Record<CourseDetail['status'], string> = {
  draft: 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
  published: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
  archived: 'bg-gray-200 text-gray-600 dark:bg-gray-700/40 dark:text-gray-400',
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

  return (
    <div className="flex flex-col gap-6" dir="rtl">
      <PageHeader
        title={course.title}
        description={[course.gradeLevel, course.teacher.fullName, `${lessonCount} درسًا`]
          .filter(Boolean)
          .join(' · ')}
        actions={
          <span
            className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_CHIP_CLASSES[course.status]}`}
          >
            {STATUS_LABELS[course.status]}
          </span>
        }
      />

      {course.description && (
        <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300">
          {course.description}
        </p>
      )}

      {course.sections.length === 0 ? (
        <EmptyState
          title="لسه مفيش محتوى في الكورس ده"
          message="لما يتم إضافة أقسام ودروس هتظهر هنا"
        />
      ) : (
        <div className="flex flex-col gap-4">
          {course.sections.map((section) => (
            <div
              key={section.id}
              className="rounded-xl border border-gray-200 p-4 dark:border-gray-700"
            >
              <h3 className="mb-3 font-semibold text-gray-900 dark:text-gray-100">
                {section.title}
              </h3>

              {section.lessons.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  لا يوجد دروس في هذا القسم بعد
                </p>
              ) : (
                <ul className="flex flex-col divide-y divide-gray-100 dark:divide-gray-800">
                  {section.lessons.map((lesson) => (
                    <li
                      key={lesson.id}
                      className="flex items-center gap-3 py-2.5 text-sm text-gray-700 dark:text-gray-200"
                    >
                      <PlayCircle className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                      <span>{lesson.title}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
