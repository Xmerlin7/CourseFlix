import { httpClient } from '../../../shared/api/http-client'
import type { SalesSummary, SalesDateFilter } from '../types/sales.types'

export async function getSalesSummary(filters: SalesDateFilter = {}): Promise<SalesSummary> {
  return httpClient.get<SalesSummary>('/teacher/sales/summary', { searchParams: filters })
}
