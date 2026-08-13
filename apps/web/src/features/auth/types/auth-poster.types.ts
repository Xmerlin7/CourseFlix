export interface AuthPosterCourse {
  id: string | null
  title: string
  description: string | null
  coverImageUrl: string | null
  gradeLevel: string | null
  teacherName: string
}

export interface AuthPosterContent {
  featuredCourseId: string | null
  course: AuthPosterCourse
  isFallback: boolean
}

export interface UpdateAuthPosterPayload {
  featuredCourseId?: string | null
}
