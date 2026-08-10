export type EnrollmentStatus = 'active' | 'suspended' | 'completed'

export interface StudentDashboardStats {
  enrolledCoursesCount: number
  activeCoursesCount: number
  completedCoursesCount: number
}

export interface StudentDashboardRecentCourse {
  courseId: string
  // The API has returned these since CF-TASK-013/014 (see
  // docs/api-conventions.md); this type was never updated to match, so the
  // dashboard had no title to render and fell back to printing the raw
  // courseId. Nullable because the course may have been soft-deleted.
  courseTitle: string | null
  coverImageUrl: string | null
  status: EnrollmentStatus
  enrolledAt: string
}

export interface StudentCurrentLesson {
  id: string
  title: string
  /** Seconds into the video the student last watched to — the video player seeks here on resume. */
  lastVideoPosition: number
}

export interface StudentDashboardContinueLearning {
  courseId: string
  courseTitle: string | null
  coverImageUrl: string | null
  gradeLevel: string | null
  progressPercent: number
  completedLessonsCount: number
  totalLessonsCount: number
  currentLesson: StudentCurrentLesson
}

export type StudentActivityType = 'enrolled' | 'lesson_completed'

export interface StudentDashboardActivityItem {
  type: StudentActivityType
  courseId: string
  courseTitle: string | null
  lessonTitle: string | null
  occurredAt: string
}

export interface StudentDashboard {
  student: {
    id: string
    // Nullable: the profile lookup can miss (e.g. a since-deleted user row).
    fullName: string | null
    email: string | null
    avatarUrl: string | null
  }
  stats: StudentDashboardStats
  /** Average progress across courses with trackable lessons; null when none do. */
  overallProgressPercent: number | null
  continueLearning: StudentDashboardContinueLearning | null
  recentCourses: StudentDashboardRecentCourse[]
  /** Most recent enrollment/lesson-completion events, newest first. */
  recentActivity: StudentDashboardActivityItem[]
}

export interface StudentEnrollment {
  id: string
  courseId: string
  // Populated by the API as of CF-TASK-013/014, but kept optional: the
  // enrichment is a bulk course lookup, so a soft-deleted course yields
  // an enrollment row with no title.
  courseTitle?: string
  coverImageUrl: string | null
  gradeLevel?: string
  status: EnrollmentStatus
  /** 0-100, derived from completedLessonsCount/totalLessonsCount server-side. */
  progressPercent: number
  completedLessonsCount: number
  totalLessonsCount: number
  /** The lesson to resume into; null once every lesson is completed or the course has no lessons yet. */
  currentLesson: StudentCurrentLesson | null
  lastActivityAt: string
}

export interface StudentEnrollmentFilters {
  status?: EnrollmentStatus
  gradeLevel?: string
}
