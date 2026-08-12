import { Link, useParams } from 'react-router'
import { NotFoundState } from '../../../shared/components/NotFoundState'
import { ROUTE_PATHS } from '../../../app/routes/route-paths'
import { DiscussionsSection } from '../components/DiscussionsSection'
import { useStudentEnrollments } from '../../student/hooks/useStudentEnrollments'
import { AnnouncementsSection } from '../components/AnnouncementsSection'
import { useState } from 'react'

type CommunityTab = 'discussions' | 'announcements'

export function StudentCourseCommunityPage() {
  const { courseId } = useParams<{ courseId: string }>()
  const { data: enrollments, isLoading } = useStudentEnrollments()
  const [activeTab, setActiveTab] = useState<CommunityTab>('discussions')

  if (!courseId) return <NotFoundState />

  const enrollment = enrollments.find((e) => e.courseId === courseId)
  // While loading we still render the community — we just won't show the title yet.
  const courseTitle = enrollment?.courseTitle ?? null

  return (
    <div className="course-community-page">
      {/* ── Back navigation ── */}
      <Link
        to={ROUTE_PATHS.STUDENT.COMMUNITY}
        className="community-back-link"
        aria-label="العودة إلى صفحة المجتمع"
      >
        <span className="ms sm" aria-hidden="true">arrow_forward</span>
        العودة للمجتمع
      </Link>

      {/* ── Page header ── */}
      <div className="community-course-page-header">
        {isLoading ? (
          <div className="skeleton" style={{ height: 26, width: 200, borderRadius: 6 }} />
        ) : (
          <h1 className="page-title">
            {courseTitle ?? 'مجتمع الدورة'}
          </h1>
        )}
        <p className="community-page-subtitle">اسأل، ناقش، واستفيد من مدرسك وزملائك</p>
      </div>

      {/* ── Tab switcher ── */}
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

      {/* ── Content ── */}
      {activeTab === 'discussions' ? (
        <DiscussionsSection courseId={courseId} />
      ) : (
        <AnnouncementsSection courseId={courseId} canManage={false} />
      )}
    </div>
  )
}
