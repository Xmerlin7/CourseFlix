export type AnalyticsIntent =
  | 'revenue'
  | 'order_count'
  | 'best_sellers'
  | 'student_count'
  | 'course_count'
  | 'active_interventions'
  | 'assistant_intro'

export interface RevenueResult {
  totalRevenue: number
  currency: string
  orderCount: number
  dateRange: { from: string | null; to: string | null }
}

export interface OrderCountResult {
  successfulOrderCount: number
  dateRange: { from: string | null; to: string | null }
}

export interface BestSellersResult {
  bestSellers: Array<{
    courseId: string
    courseTitle: string
    orderCount: number
    totalRevenue: number
  }>
  dateRange: { from: string | null; to: string | null }
}

export interface StudentCountResult {
  activeStudentCount: number
  enrollmentCount: number
  dateRange: { from: string | null; to: string | null }
}

export interface CourseCountResult {
  totalCourses: number
  publishedCourses: number
  draftCourses: number
  archivedCourses: number
  dateRange: { from: string | null; to: string | null }
}

export interface ActiveInterventionsResult {
  activeInterventionCount: number
  affectedStudentCount: number
  dateRange: { from: string | null; to: string | null }
}

export type AnalyticsQuestionResponse =
  | {
      status: 'success'
      intent: AnalyticsIntent
      result:
        | RevenueResult
        | OrderCountResult
        | BestSellersResult
        | StudentCountResult
        | CourseCountResult
        | ActiveInterventionsResult
    }
  | {
      status: 'direct'
      message: string
      examples: string[]
    }
  | {
      status: 'unsupported'
      message: string
      supportedIntents: Array<{ intent: string; description: string }>
      examples: string[]
    }
