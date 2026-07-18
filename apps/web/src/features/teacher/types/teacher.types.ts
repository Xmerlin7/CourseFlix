export interface TeacherDashboard {
  ownedCourseCount: number
  activeCourseCount: number
  enrolledStudentCount: number
}

export interface TeacherCourse {
  id: string
  title: string
  description: string
  gradeLevel: string
  status: 'draft' | 'active' | 'archived'
}

export interface UpdateTeacherCoursePayload {
  title?: string
  description?: string
  gradeLevel?: string
  status?: 'draft' | 'active' | 'archived'
}
