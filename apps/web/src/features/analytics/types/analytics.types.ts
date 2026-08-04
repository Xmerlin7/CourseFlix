export type AnalyticsIntent = 'revenue' | 'order_count' | 'best_sellers'

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

export type AnalyticsQuestionResponse =
  | {
      status: 'success'
      intent: AnalyticsIntent
      result: RevenueResult | OrderCountResult | BestSellersResult
    }
  | {
      status: 'unsupported'
      message: string
      supportedIntents: Array<{ intent: string; description: string }>
      examples: string[]
    }
