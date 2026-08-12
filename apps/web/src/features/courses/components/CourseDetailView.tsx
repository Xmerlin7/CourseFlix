import { Fragment, lazy, Suspense, useState } from 'react'
import { Link } from 'react-router'
import { EmptyState } from '../../../shared/components/EmptyState'
import { COURSE_STATUS } from '../../../shared/lib/status-labels'
import { CommunityPanelSkeleton } from '../../community/components/CommunityPanelSkeleton'
import { StudentDocumentsList } from '../../course-documents/components/StudentDocumentsList'
import type { QuizSummary } from '../../quizzes/types/quiz.types'
import type { CourseDetail } from '../types/course.types'

const CourseCommunityPanel = lazy(() =>
  import('../../community/components/CourseCommunityPanel').then((m) => ({ default: m.CourseCommunityPanel })),
)

interface CourseDetailViewProps {
  course: CourseDetail
  courseQuizzes?: QuizSummary[]
  areQuizzesLoading?: boolean
  quizzesError?: boolean
}

/**
 * Shared student/teacher course-detail presentation. Both
 * StudentCourseDetailPage and TeacherCourseDetailPage render this against
 * the same GET /api/v1/courses/:courseId response — the owning teacher
 * additionally renders TeacherCourseForm alongside it.
 */
export function CourseDetailView({
  course,
  courseQuizzes = [],
  areQuizzesLoading = false,
  quizzesError = false,
}: CourseDetailViewProps) {
  const [activeMediaTab, setActiveMediaTab] = useState<'videos' | 'files' | 'community'>('videos')
  const lessonCount = course.sections.reduce(
    (total, section) => total + section.lessons.length,
    0,
  )
  const status = COURSE_STATUS[course.status]
  const visibleQuizzes = course.canEdit ? [] : courseQuizzes
  const courseLevelQuizzes = visibleQuizzes.filter((quiz) => !quiz.sectionId && !quiz.lessonId)

  function quizzesForLesson(lessonId: string): QuizSummary[] {
    return visibleQuizzes.filter((quiz) => quiz.lessonId === lessonId)
  }

  function quizzesForSection(sectionId: string): QuizSummary[] {
    return visibleQuizzes.filter((quiz) => quiz.sectionId === sectionId && !quiz.lessonId)
  }

  const videosSection =
    course.sections.length === 0 ? (
      <EmptyState
        title="لسه مفيش محتوى في الدورة دي"
        message="لما يتم إضافة أقسام ودروس هتظهر هنا"
      />
    ) : (
      course.sections.map((section) => (
        <section key={section.id} className="section">
          <div className="section-head">
            <h2>{section.title}</h2>
          </div>

          {section.lessons.length === 0 ? (
            <p className="subtitle">لا يوجد دروس في هذا القسم بعد</p>
          ) : (
            <div className="list">
              {section.lessons.map((lesson) => {
                const lessonPath = course.canEdit
                  ? `/teacher/lessons/${lesson.id}`
                  : `/student/lessons/${lesson.id}`
                const canOpenLesson = !course.canEdit || Boolean(lesson.videoUrl)
                const lessonQuizzes = quizzesForLesson(lesson.id)

                return (
                  <Fragment key={lesson.id}>
                    {canOpenLesson ? (
                      <Link to={lessonPath} className="list-item">
                        <span className="lead">
                          <span className="ms">play_circle</span>
                        </span>
                        <span className="body">
                          <span className="t">{lesson.title}</span>
                          {course.canEdit && <span className="s">فتح الدرس ومتابعة محتوى الكورس</span>}
                        </span>
                      </Link>
                    ) : (
                      <div className="list-item">
                        <span className="lead">
                          <span className="ms">play_circle</span>
                        </span>
                        <span className="body">
                          <span className="t">{lesson.title}</span>
                          <span className="s">أضف رابط فيديو عشان تفتح المعاينة</span>
                        </span>
                      </div>
                    )}
                    {lessonQuizzes.map((quiz) => (
                      <QuizListItem key={quiz.id} quiz={quiz} contextLabel="اختبار بعد الدرس" />
                    ))}
                  </Fragment>
                )
              })}
              {quizzesForSection(section.id).map((quiz) => (
                <QuizListItem key={quiz.id} quiz={quiz} contextLabel="اختبار القسم" />
              ))}
            </div>
          )}
        </section>
      ))
    )

  return (
    <>
      <div className="card course-detail-header-card">
        <div className="course-detail-header-top">
          <div className="course-detail-title-group">
            <h1 className="page-title">{course.title}</h1>
            <div className="course-detail-meta-list">
              {course.gradeLevel && (
                <span className="course-detail-meta-item">
                  <span className="ms sm" aria-hidden="true">school</span>
                  {course.gradeLevel}
                </span>
              )}
              {course.teacher.fullName && (
                <span className="course-detail-meta-item">
                  <span className="ms sm" aria-hidden="true">person</span>
                  المدرس: {course.teacher.fullName}
                </span>
              )}
              <span className="course-detail-meta-item">
                <span className="ms sm" aria-hidden="true">play_circle</span>
                {lessonCount} {lessonCount === 1 ? 'درس' : 'دروس'}
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            {!course.canEdit && (
              <Link to={`/student/courses/${course.id}/assistant`} className="btn tonal">
                <span className="ms" aria-hidden="true">smart_toy</span>
                اسأل المساعد
              </Link>
            )}
            {course.canEdit && <span className={`chip ${status.chip}`}>{status.label}</span>}
          </div>
        </div>

        {course.description && (
          <p className="course-detail-description">{course.description}</p>
        )}
      </div>

      {course.canEdit ? (
        videosSection
      ) : (
        <>
          <div className="course-detail-tabs" role="tablist" aria-label="أقسام الدورة">
            <button
              type="button"
              role="tab"
              aria-selected={activeMediaTab === 'videos'}
              onClick={() => setActiveMediaTab('videos')}
              className={`course-detail-tab-btn${activeMediaTab === 'videos' ? ' active' : ''}`}
            >
              <span className="ms sm" aria-hidden="true">video_library</span>
              فيديوهات
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeMediaTab === 'files'}
              onClick={() => setActiveMediaTab('files')}
              className={`course-detail-tab-btn${activeMediaTab === 'files' ? ' active' : ''}`}
            >
              <span className="ms sm" aria-hidden="true">folder</span>
              ملفات
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeMediaTab === 'community'}
              onClick={() => setActiveMediaTab('community')}
              className={`course-detail-tab-btn${activeMediaTab === 'community' ? ' active' : ''}`}
            >
              <span className="ms sm" aria-hidden="true">forum</span>
              المجتمع
            </button>
          </div>

          {activeMediaTab === 'videos' && videosSection}
          {activeMediaTab === 'files' && <StudentDocumentsList courseId={course.id} />}
          {activeMediaTab === 'community' && (
            <Suspense fallback={<CommunityPanelSkeleton />}>
              <CourseCommunityPanel courseId={course.id} />
            </Suspense>
          )}
        </>
      )}

      {!course.canEdit && areQuizzesLoading && (
        <p className="subtitle">جارٍ تحميل اختبارات الدورة...</p>
      )}

      {!course.canEdit && quizzesError && (
        <p role="alert" style={{ color: 'var(--error)', fontSize: 13.5, fontWeight: 700 }}>
          تعذر تحميل اختبارات الدورة
        </p>
      )}

      {courseLevelQuizzes.length > 0 && (
        <section className="section" style={{ marginTop: 24 }}>
          <div className="section-head">
            <h2>
              <span className="ms" style={{ verticalAlign: 'middle', marginInlineEnd: 6 }}>
                quiz
              </span>
              اختبارات الدورة
            </h2>
          </div>
          <div className="list">
            {courseLevelQuizzes.map((quiz) => (
              <QuizListItem key={quiz.id} quiz={quiz} contextLabel="اختبار الدورة" />
            ))}
          </div>
        </section>
      )}
    </>
  )
}


function QuizListItem({
  quiz,
  contextLabel,
}: {
  quiz: QuizSummary
  contextLabel: string
}) {
  return (
    <Link to={`/student/quizzes/${quiz.id}`} className="list-item quiz-after-lesson">
      <span className="lead">
        <span className="ms">quiz</span>
      </span>
      <span className="body">
        <span className="t">{quiz.title}</span>
        <span className="s">
          {contextLabel} - {quiz.questionCount} سؤال
          {quiz.submission
            ? ` - تم الحل: ${quiz.submission.score} / ${quiz.submission.total}`
            : ' - جاهز للحل'}
        </span>
      </span>
      <span className="end">
        <span className={`chip${quiz.submission ? ' green' : ''}`}>
          {quiz.submission ? 'تم الحل' : 'ابدأ'}
        </span>
      </span>
    </Link>
  )
}
