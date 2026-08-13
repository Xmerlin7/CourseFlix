import { useEffect, useState } from 'react'
import { getTeacherQuota } from '../api/teacher-billing.api'
import type { TeacherQuota } from '../types/teacher-billing.types'

/**
 * The teacher's quota for the topbar chip. Loaded once on mount and only
 * when enabled — the API route is teacher-only, so the layout gates this
 * on `role === 'teacher'` and the assistant never fires it. Failures are
 * silent: a missing chip is better than an error toast in the topbar.
 */
export function useTeacherQuota(enabled: boolean): TeacherQuota | null {
  const [quota, setQuota] = useState<TeacherQuota | null>(null)

  useEffect(() => {
    if (!enabled) return
    let cancelled = false
    getTeacherQuota()
      .then((next) => {
        if (!cancelled) setQuota(next)
      })
      .catch(() => {
        // Silent: quota is supplementary chrome, not page content.
      })
    return () => {
      cancelled = true
    }
  }, [enabled])

  return quota
}
