export type LessonProgressStatus = 'not_started' | 'in_progress' | 'completed'

export type VideoModerationStatus = 'pending' | 'approved' | 'rejected'

export interface LessonVideo {
  id: string
  // Null when the video hasn't cleared moderation. Students always get
  // null in that case; teachers get the real URL so they can review it.
  url: string | null
  durationSeconds: number | null
  moderationStatus: VideoModerationStatus
  // Teacher-only — the API sends null to students.
  moderationReason: string | null
}

export interface LessonProgress {
  lastPositionSeconds: number
  watchedPercentage: number
  status: LessonProgressStatus
}

export interface LessonCourseOutlineLesson {
  id: string
  title: string
  sortOrder: number
  progressStatus?: LessonProgressStatus
  watchedPercentage?: number
}

export interface LessonCourseOutlineSection {
  id: string
  title: string
  sortOrder: number
  lessons: LessonCourseOutlineLesson[]
}

export interface LessonCourseOutline {
  id: string
  title: string
  currentSectionId: string
  sections: LessonCourseOutlineSection[]
}

export interface LessonDetail {
  id: string
  title: string
  video: LessonVideo
  course: LessonCourseOutline
  progress: LessonProgress
}

export interface UpdateProgressRequest {
  positionSeconds: number
  watchedSeconds: number
  durationSeconds?: number
}

export interface UpdateProgressResponse {
  watchedPercentage: number
  status: LessonProgressStatus
  attendanceAwarded: boolean
}
