export type EnrollmentStatus = 'active' | 'suspended' | 'completed'

export interface StudentDashboardStats {
  enrolledCoursesCount: number
  activeCoursesCount: number
}

export interface StudentDashboardRecentCourse {
  courseId: string
  status: EnrollmentStatus
  enrolledAt: string
}

export interface StudentDashboard {
  student: {
    id: string
  }
  stats: StudentDashboardStats
  overallProgressPercent: null
  continueLearning: null
  recentCourses: StudentDashboardRecentCourse[]
}

export interface StudentEnrollment {
  id: string
  courseId: string
  // TODO(blocked on Seif's course service): these become required once
  // CourseEntity is real and enrollments can join into it. Until then the
  // backend genuinely can't populate them — optional here rather than
  // pretending we have real course data.
  courseTitle?: string
  gradeLevel?: string
  status: EnrollmentStatus
}

export interface StudentEnrollmentFilters {
  status?: EnrollmentStatus
  gradeLevel?: string
}