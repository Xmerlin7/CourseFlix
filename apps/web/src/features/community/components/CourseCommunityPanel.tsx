import { useAuth } from '../../auth/hooks/useAuth'
import { AnnouncementsSection } from './AnnouncementsSection'
import { DiscussionsSection } from './DiscussionsSection'

interface CourseCommunityPanelProps {
  courseId: string
}

/**
 * Embedded in the course-detail page's "Community" tab for both
 * students and teachers/assistants — access itself is still enforced
 * server-side per request (see DiscussionsService/AnnouncementsService),
 * this component only decides what to *render*.
 */
export function CourseCommunityPanel({ courseId }: CourseCommunityPanelProps) {
  const { user } = useAuth()
  const canManageAnnouncements = user?.role === 'teacher' || user?.role === 'assistant'

  return (
    <div>
      <AnnouncementsSection courseId={courseId} canManage={canManageAnnouncements} />
      <DiscussionsSection courseId={courseId} />
    </div>
  )
}
