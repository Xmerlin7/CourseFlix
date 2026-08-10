import { Link, useNavigate } from 'react-router'
import { EmptyState } from '../../../shared/components/EmptyState'
import { ErrorState } from '../../../shared/components/ErrorState'
import { ForbiddenState } from '../../../shared/components/ForbiddenState'
import { LoadingState } from '../../../shared/components/LoadingState'
import { ENROLLMENT_STATUS, NOTIFICATION_TYPE } from '../../../shared/lib/status-labels'
import { useNotifications } from '../../notifications/hooks/useNotifications'
import { useStudentDashboard } from '../hooks/useStudentDashboard'
import type { StudentDashboardActivityItem } from '../types/student.types'

const QUICK_ACCESS_ITEMS = [
  { to: '/student/courses', label: 'دوراتي', icon: 'menu_book' },
  { to: '/student/browse', label: 'استكشف الدورات', icon: 'explore' },
  { to: '/student/notifications', label: 'الإشعارات', icon: 'notifications' },
  { to: '/student/interventions', label: 'نقاط تحتاج مراجعة', icon: 'monitoring' },
]

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ar-EG')
}

function activityText(item: StudentDashboardActivityItem): string {
  if (item.type === 'lesson_completed') {
    return `أكملت درس "${item.lessonTitle}" في ${item.courseTitle ?? 'دورة غير متاحة'}`
  }
  return `بدأت دورة ${item.courseTitle ?? 'غير متاحة'}`
}

/**
 * "الرئيسية" — a quick overview (continue learning, stats, recent activity),
 * not a second copy of "دوراتي" (the full course list/filters/management
 * page). Since the login redirect (get-role-home-path.ts) now sends
 * students straight to دوراتي, this page is reached only via the sidebar
 * or logo — a students-choose-to-visit summary, not the landing page.
 */
export function StudentDashboardPage() {
  const navigate = useNavigate()
  const { data, isLoading, error, refetch } = useStudentDashboard()
  const notifications = useNotifications()

  if (isLoading) return <LoadingState variant="student-home" />

  if (error) {
    if (error.status === 403) return <ForbiddenState />
    return <ErrorState onRetry={refetch} />
  }

  if (!data) return <EmptyState />

  const firstName = data.student.fullName?.trim().split(/\s+/)[0]
  const hasCourses = data.stats.enrolledCoursesCount > 0
  const allCoursesCompleted =
    hasCourses && data.stats.completedCoursesCount === data.stats.enrolledCoursesCount
  const recentActivity = data.recentActivity.slice(0, 5)
  const recentNotifications = notifications.data.slice(0, 3)
  const showNotifications =
    !notifications.isLoading && !notifications.error && recentNotifications.length > 0

  return (
    <>
      <h1 className="page-title">أهلاً{firstName ? ` ${firstName}` : ''}</h1>
      <p className="subtitle">جاهز تكمل رحلتك التعليمية؟</p>

      {!hasCourses && (
        <EmptyState
          variant="courses"
          title="أهلاً بك في CourseFlix"
          message="ابدأ رحلتك التعليمية واكتشف دوراتك"
          actionLabel="استكشف الدورات"
          onAction={() => navigate('/student/browse')}
          fullPage
        />
      )}

      {hasCourses && (
        <>
          <section className="section" aria-label="استكمل التعلم">
            <div className="section-head" style={{ marginBottom: 14 }}>
              <h2 style={{ fontSize: 20 }}>استكمل التعلم</h2>
            </div>

            {data.continueLearning && (
              <div className="continue-learning-card card">
                <div className="continue-learning-info">
                  <div className="continue-learning-header">
                    <span className="continue-badge">
                      <span className="pulse-dot" aria-hidden="true" />
                      قيد التعلم الحالي
                    </span>
                    {data.continueLearning.gradeLevel && (
                      <span className="continue-grade">{data.continueLearning.gradeLevel}</span>
                    )}
                  </div>

                  <h3 className="continue-course-title">
                    {data.continueLearning.courseTitle ?? 'دورة غير متاحة'}
                  </h3>

                  <p className="continue-last-lesson">
                    <strong>آخر درس:</strong> {data.continueLearning.currentLesson.title}
                  </p>

                  <div className="continue-progress-block">
                    <div className="progress-label-row">
                      <span>نسبة التقدم</span>
                      <span className="progress-value">{data.continueLearning.progressPercent}%</span>
                    </div>
                    <div className="progress">
                      <div
                        className="bar"
                        style={{ width: `${Math.min(100, data.continueLearning.progressPercent)}%` }}
                      />
                    </div>
                  </div>

                  {data.continueLearning.totalLessonsCount > 0 && (
                    <span className="continue-lesson-count">
                      {data.continueLearning.completedLessonsCount} من{' '}
                      {data.continueLearning.totalLessonsCount} درس مكتمل
                    </span>
                  )}
                </div>

                <div className="continue-learning-action">
                  <Link
                    to={`/student/lessons/${data.continueLearning.currentLesson.id}`}
                    className="btn big continue-btn"
                  >
                    <span className="ms" aria-hidden="true">play_arrow</span>
                    استكمل الآن
                  </Link>
                </div>
              </div>
            )}

            {!data.continueLearning && allCoursesCompleted && (
              <div className="card continue-empty-card">
                <h3 style={{ margin: 0 }}>أحسنت! 🎉</h3>
                <p className="continue-empty-message">أكملت دوراتك الحالية.</p>
                <Link to="/student/courses" className="btn tonal">
                  <span className="ms" aria-hidden="true">auto_stories</span>
                  مراجعة دوراتك
                </Link>
              </div>
            )}

            {!data.continueLearning && !allCoursesCompleted && (
              <div className="card continue-empty-card">
                <h3 style={{ margin: 0 }}>لا يوجد تعلم مستمر حاليًا</h3>
                <p className="continue-empty-message">اختر دورة وابدأ من حيث تريد.</p>
                <Link to="/student/courses" className="btn tonal">
                  <span className="ms" aria-hidden="true">menu_book</span>
                  تصفح دوراتي
                </Link>
              </div>
            )}
          </section>

          <div className="tiles section">
            <div className="tile">
              <span className="lead-ic">
                <span className="ms">menu_book</span>
              </span>
              <span className="lbl">دوراتي</span>
              <span className="num">{data.stats.enrolledCoursesCount}</span>
            </div>

            <div className="tile">
              <span className="lead-ic">
                <span className="ms">play_circle</span>
              </span>
              <span className="lbl">نشطة</span>
              <span className="num">{data.stats.activeCoursesCount}</span>
            </div>

            <div className="tile">
              <span className="lead-ic">
                <span className="ms">check_circle</span>
              </span>
              <span className="lbl">مكتملة</span>
              <span className="num">{data.stats.completedCoursesCount}</span>
            </div>

            <div className="tile" aria-disabled={data.overallProgressPercent === null}>
              <span className="lead-ic">
                <span className="ms">monitoring</span>
              </span>
              <span className="lbl">نسبة التقدم</span>
              <span className="num">
                {data.overallProgressPercent === null ? '—' : `${data.overallProgressPercent}%`}
              </span>
              {data.overallProgressPercent === null && <span className="sub">غير متاحة بعد</span>}
            </div>
          </div>

          {recentActivity.length > 0 && (
            <section className="section">
              <div className="section-head">
                <h2>آخر نشاط</h2>
              </div>
              <div className="list">
                {recentActivity.map((item, index) => (
                  <div key={`${item.type}-${item.courseId}-${index}`} className="list-item">
                    <span className={`lead ${item.type === 'lesson_completed' ? 'green' : ''}`}>
                      <span className="ms">
                        {item.type === 'lesson_completed' ? 'check_circle' : 'add_circle'}
                      </span>
                    </span>
                    <span className="body">
                      <span className="t">{activityText(item)}</span>
                      <span className="s">{formatDate(item.occurredAt)}</span>
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {showNotifications && (
            <section className="section">
              <div className="section-head">
                <h2>آخر الإشعارات</h2>
                <Link to="/student/notifications" className="see-all">
                  عرض الكل
                  <span className="ms">chevron_left</span>
                </Link>
              </div>
              <div className="list">
                {recentNotifications.map((notification) => {
                  const meta = NOTIFICATION_TYPE[notification.type]
                  return (
                    <div key={notification.id} className="list-item">
                      <span className={`lead ${meta.lead}`}>
                        <span className="ms">{meta.icon}</span>
                      </span>
                      <span className="body">
                        <span className="t">{notification.title}</span>
                        <span className="s">{notification.message}</span>
                      </span>
                      <span className="end">
                        {!notification.isRead && (
                          <span className="unread-dot" aria-label="غير مقروء" />
                        )}
                      </span>
                    </div>
                  )
                })}
              </div>
            </section>
          )}

          <section className="section">
            <div className="actions section" role="group" aria-label="الوصول السريع">
              {QUICK_ACCESS_ITEMS.map((item) => (
                <Link key={item.to} to={item.to} className="chip clickable outline">
                  <span className="ms sm" aria-hidden="true">{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </div>

            <div className="section-head">
              <h2>دوراتك</h2>
              <Link to="/student/courses" className="see-all">
                عرض كل دوراتي
                <span className="ms">chevron_left</span>
              </Link>
            </div>

            <div className="list">
              {data.recentCourses.slice(0, 3).map((course) => {
                const status = ENROLLMENT_STATUS[course.status]

                return (
                  <Link
                    key={course.courseId}
                    to={`/student/courses/${course.courseId}`}
                    className="list-item"
                  >
                    <span className="lead">
                      <span className="ms">menu_book</span>
                    </span>

                    <span className="body">
                      <span className="t">{course.courseTitle ?? 'دورة غير متاحة'}</span>
                      <span className="s">
                        انضممت في {formatDate(course.enrolledAt)}
                      </span>
                    </span>

                    <span className="end">
                      <span className={`chip ${status.chip}`}>{status.label}</span>
                    </span>
                  </Link>
                )
              })}
            </div>
          </section>
        </>
      )}
    </>
  )
}
