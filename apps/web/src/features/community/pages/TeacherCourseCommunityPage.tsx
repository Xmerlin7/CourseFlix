import { useState, useEffect } from 'react'
import { Link, useParams, useSearchParams } from 'react-router'
import { ROUTE_PATHS } from '../../../app/routes/route-paths'
import { NotFoundState } from '../../../shared/components/NotFoundState'
import { AnnouncementsSection } from '../components/AnnouncementsSection'
import { DiscussionsSection } from '../components/DiscussionsSection'
import { useTeacherCourses } from '../../teacher/hooks/useTeacherCourses'
import { markCourseCommunityRead } from '../api/community.api'
import { emitUnreadCountChanged } from '../../notifications/utils/notificationEvents'

type CommunityTab = 'discussions' | 'announcements'

export function TeacherCourseCommunityPage() {
  const { courseId } = useParams<{ courseId: string }>()
  const [searchParams] = useSearchParams()
  const focusPostId = searchParams.get('post') ?? undefined
  const { data: courses, isLoading } = useTeacherCourses()
  const [activeTab, setActiveTab] = useState<CommunityTab>(
    focusPostId ? 'announcements' : 'discussions',
  )

  useEffect(() => {
    if (!courseId) return
    void markCourseCommunityRead(courseId)
      .then(() => emitUnreadCountChanged())
      .catch(() => {})
  }, [courseId])

  if (!courseId) return <NotFoundState />

  const course = courses.find((item) => item.id === courseId)
  const courseTitle = course?.title ?? null

  return (
    <div className="course-community-page">
      <Link
        to={ROUTE_PATHS.TEACHER.COMMUNITY}
        className="community-back-link"
        aria-label="العودة إلى صفحة المجتمع"
      >
        <span className="ms sm" aria-hidden="true">arrow_forward</span>
        العودة للمجتمع
      </Link>

      <div className="community-course-page-header">
        {isLoading ? (
          <div className="skeleton" style={{ height: 26, width: 200, borderRadius: 6 }} />
        ) : (
          <h1 className="page-title">{courseTitle ?? 'مجتمع الدورة'}</h1>
        )}
        <p className="community-page-subtitle">تابع أسئلة الطلاب وانشر إعلانات الدورة</p>
      </div>

      <div className="community-tabs" role="tablist" aria-label="أقسام المجتمع">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'discussions'}
          className={`support-filter-chip${activeTab === 'discussions' ? ' active' : ''}`}
          onClick={() => setActiveTab('discussions')}
        >
          <span className="ms sm" aria-hidden="true">forum</span>
          المناقشات
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'announcements'}
          className={`support-filter-chip${activeTab === 'announcements' ? ' active' : ''}`}
          onClick={() => setActiveTab('announcements')}
        >
          <span className="ms sm" aria-hidden="true">campaign</span>
          الإعلانات
        </button>
      </div>

      {activeTab === 'discussions' ? (
        <DiscussionsSection courseId={courseId} />
      ) : (
        <AnnouncementsSection courseId={courseId} canManage highlightPostId={focusPostId} />
      )}
    </div>
  )
}
