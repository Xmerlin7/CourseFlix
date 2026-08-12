import { httpClient } from '../../../shared/api/http-client'
import type { SalesSummary, SalesDateFilter } from '../types/sales.types'

// The API's range is half-open [from, to) (docs/api/sprint3-sales.md), but
// the date picker's "to" value is the last day the user wants included.
// Shift it one day forward so that day's orders aren't silently excluded —
// without this, picking the same from/to day (e.g. the "اليوم" preset)
// always yields an empty/rejected range.
function toExclusiveUpperBound(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number)
  const next = new Date(year, month - 1, day + 1)
  const y = next.getFullYear()
  const m = String(next.getMonth() + 1).padStart(2, '0')
  const d = String(next.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export async function getSalesSummary(filters: SalesDateFilter = {}): Promise<SalesSummary> {
  return httpClient.get<SalesSummary>('/teacher/sales/summary', {
    searchParams: {
      from: filters.from,
      to: filters.to ? toExclusiveUpperBound(filters.to) : undefined,
    },
  })
}
