export type EnrollmentStatus = 'active' | 'suspended' | 'completed'

export interface StudentDashboardStats {
  enrolledCoursesCount: number
  activeCoursesCount: number
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

export interface StudentDashboard {
  student: {
    id: string
    fullName: string
    email: string
    avatarUrl: string | null
  }
  stats: StudentDashboardStats
  // Both stay null until progress tracking lands — see the Sprint 1
  // boundary note in docs/api-conventions.md.
  overallProgressPercent: null
  continueLearning: null
  recentCourses: StudentDashboardRecentCourse[]
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
}

export interface StudentEnrollmentFilters {
  status?: EnrollmentStatus
  gradeLevel?: string
}
