export interface CourseLesson {
  id: string
  title: string
  videoUrl: string | null
  sortOrder: number
}

export interface CourseSection {
  id: string
  title: string
  sortOrder: number
  lessons: CourseLesson[]
}

export interface CourseDetail {
  id: string
  title: string
  description: string
  gradeLevel: string
  canEdit: boolean
  sections: CourseSection[]
}
