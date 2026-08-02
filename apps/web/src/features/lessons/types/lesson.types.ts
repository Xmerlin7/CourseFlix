export type LessonProgressStatus = 'not_started' | 'in_progress' | 'completed'

export interface LessonVideo {
  id: string
  url: string
  durationSeconds: number | null
}

export interface LessonProgress {
  lastPositionSeconds: number
  watchedPercentage: number
  status: LessonProgressStatus
}

export interface LessonDetail {
  id: string
  title: string
  video: LessonVideo
  progress: LessonProgress
}

export interface UpdateProgressRequest {
  positionSeconds: number
  watchedSeconds: number
}

export interface UpdateProgressResponse {
  watchedPercentage: number
  status: LessonProgressStatus
  attendanceAwarded: boolean
}
