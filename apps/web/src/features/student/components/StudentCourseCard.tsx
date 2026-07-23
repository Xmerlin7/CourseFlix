import type { StudentEnrollment } from '../types/student.types'

interface StudentCourseCardProps {
  enrollment: StudentEnrollment
}

// NOTE: plain <a> instead of react-router's <Link> — routing isn't
// installed yet (AppRouter.tsx still has a literal TODO for it). Swap
// this for <Link> once Elgendy's routing lands, so this navigates
// client-side instead of doing a full page reload.
export function StudentCourseCard({ enrollment }: StudentCourseCardProps) {
  return (
    <a
      href={`/student/courses/${enrollment.courseId}`}
      className="flex flex-col gap-2 rounded-xl border border-gray-200 p-4 transition-shadow hover:shadow-md dark:border-gray-700"
    >
      <h3 className="font-semibold text-gray-900 dark:text-gray-100">
        {/* TODO(blocked on Seif's course service): real title once the
            course join is available — see student.types.ts TODO. */}
        {enrollment.courseTitle ?? `Course ${enrollment.courseId}`}
      </h3>

      {enrollment.gradeLevel && (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {enrollment.gradeLevel}
        </p>
      )}

      <span className="w-fit rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium uppercase tracking-wide text-primary">
        {enrollment.status}
      </span>
    </a>
  )
}