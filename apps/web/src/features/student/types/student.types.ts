export interface StudentDashboard {
  enrolledCourseCount: number
  overallProgressPercent: number | null
  continueLearning: null
}

export interface StudentEnrollment {
  id: string
  courseId: string
  courseTitle: string
  gradeLevel: string
  status: 'active' | 'completed' | 'cancelled'
}

export interface StudentEnrollmentFilters {
  status?: string
  gradeLevel?: string
}
