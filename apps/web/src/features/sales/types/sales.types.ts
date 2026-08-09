export interface SalesBestSeller {
  courseId: string
  title: string
  ordersCount: number
  revenueMinor: number
}

// Mirrors apps/api/src/modules/sales/sales.service.ts SalesSummaryResponse —
// docs/api/sprint3-sales.md is the contract of record.
export interface SalesSummary {
  from: string | null
  to: string | null
  currency: string
  timezone: string
  revenueMinor: number
  ordersCount: number
  bestSeller: SalesBestSeller | null
}

export interface SalesDateFilter {
  from?: string
  to?: string
}
