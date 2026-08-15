import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { ROUTE_PATHS } from '../../../app/routes/route-paths'
import { ErrorState } from '../../../shared/components/ErrorState'
import { LoadingState } from '../../../shared/components/LoadingState'
import { useAuth } from '../../auth/hooks/useAuth'
import { getAnnouncement } from '../api/community.api'

/**
 * Resolves an announcement-notification deep link. The notification only
 * carries the post id, but the post lives inside a course community, so this
 * lightweight page fetches the post to learn its course and forwards to that
 * course's community page with `?post=` set — which then opens the
 * announcements tab and scrolls to / highlights the exact announcement.
 */
export function AnnouncementRedirectPage() {
  const { postId } = useParams<{ postId: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState<unknown>(null)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (!postId) return
    let cancelled = false

    getAnnouncement(postId)
      .then((announcement) => {
        if (cancelled) return
        const role = user?.role
        const template =
          role === 'teacher' || role === 'assistant'
            ? ROUTE_PATHS.TEACHER.COMMUNITY_COURSE
            : role === 'student'
              ? ROUTE_PATHS.STUDENT.COMMUNITY_COURSE
              : null

        if (!template) {
          navigate(ROUTE_PATHS.NOT_FOUND, { replace: true })
          return
        }
        const path = `${template.replace(':courseId', announcement.courseId)}?post=${announcement.id}`
        navigate(path, { replace: true })
      })
      .catch((caught) => {
        if (!cancelled) setError(caught)
      })

    return () => {
      cancelled = true
    }
  }, [postId, user?.role, navigate, attempt])

  if (error) {
    return <ErrorState onRetry={() => setAttempt((value) => value + 1)} />
  }

  return <LoadingState variant="list" count={2} />
}
