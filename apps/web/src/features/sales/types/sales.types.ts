export interface SalesSummary {
  totalRevenue: number
  currency: string
  successfulOrderCount: number
  bestSellingCourse: {
    courseId: string
    courseTitle: string
    orderCount: number
    totalRevenue: number
  } | null
  dateRange: { from: string | null; to: string | null }
}

export interface SalesDateFilter {
  from?: string
  to?: string
}
