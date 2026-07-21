export type EnrollmentStatus = 'active' | 'suspended' | 'completed'

// NOTE: fixed from the old 'active' | 'completed' | 'cancelled' union to
// match the real backend enum in schemaV2.sql / enrollment.entity.ts.

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
  courseTitle: string
  gradeLevel: string
  status: EnrollmentStatus
}

export interface StudentEnrollmentFilters {
  status?: EnrollmentStatus
  gradeLevel?: string
}