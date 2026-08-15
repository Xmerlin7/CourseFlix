import { useEffect, useMemo, useState } from 'react'
import { showToast } from '../../../shared/components/Toast'
import { getAdminCourseDetail } from '../../admin/api/admin-courses.api'
import { useAdminCourses } from '../../admin/hooks/useAdminCourses'
import { TeacherPoster } from '../../auth/components/TeacherPoster'
import { useAdminAuthPoster } from '../../auth/hooks/useAdminAuthPoster'
import type { AuthPosterContent } from '../../auth/types/auth-poster.types'
import type { CourseDetail } from '../../courses/types/course.types'

export function AdminAuthPosterSettingsForm() {
  const poster = useAdminAuthPoster()
  const courses = useAdminCourses({ status: 'published' })
  const [selectedCourseOverride, setSelectedCourseOverride] = useState<string>()
  const [selectedCourseDetail, setSelectedCourseDetail] = useState<CourseDetail | null>(null)
  const [isPreviewLoading, setIsPreviewLoading] = useState(false)
  const selectedCourseId =
    selectedCourseOverride ?? poster.data?.featuredCourseId ?? ''

  const selectedCourse = useMemo(
    () => courses.data?.find((course) => course.id === selectedCourseId) ?? null,
    [courses.data, selectedCourseId],
  )

  useEffect(() => {
    const controller = new AbortController()

    async function loadSelectedCourse() {
      if (!selectedCourseId) {
        setSelectedCourseDetail(null)
        setIsPreviewLoading(false)
        return
      }

      setIsPreviewLoading(true)
      try {
        const detail = await getAdminCourseDetail(selectedCourseId)
        if (!controller.signal.aborted) {
          setSelectedCourseDetail(detail)
        }
      } catch {
        if (!controller.signal.aborted) {
          setSelectedCourseDetail(null)
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsPreviewLoading(false)
        }
      }
    }

    void loadSelectedCourse()

    return () => controller.abort()
  }, [selectedCourseId])

  const previewContent: AuthPosterContent | null = selectedCourseDetail
    ? {
        featuredCourseId: selectedCourseDetail.id,
        isFallback: false,
        customization: poster.data?.customization,
        course: {
          id: selectedCourseDetail.id,
          title: selectedCourseDetail.title,
          description: selectedCourseDetail.description,
          coverImageUrl: selectedCourseDetail.coverImageUrl,
          gradeLevel: selectedCourseDetail.gradeLevel,
          teacherName: selectedCourseDetail.teacher.fullName,
        },
      }
    : selectedCourse
      ? {
          featuredCourseId: selectedCourse.id,
          isFallback: false,
          customization: poster.data?.customization,
          course: {
            id: selectedCourse.id,
            title: selectedCourse.title,
            description: null,
            coverImageUrl: null,
            gradeLevel: selectedCourse.gradeLevel,
            teacherName: selectedCourse.teacherName,
          },
        }
      : poster.data

  async function handleSave() {
    try {
      await poster.saveFeaturedCourse(selectedCourseId || null)
      showToast('تم تحديث واجهة الدخول بنجاح', 'success')
    } catch {
      showToast('تعذر تحديث واجهة الدخول، تأكد من اختيار دورة منشورة', 'error')
    }
  }

  return (
    <div className="settings-cards-grid">
      <div className="card settings-card">
        <h3 style={{ marginBottom: 0 }}>الدورة الظاهرة في واجهة الدخول</h3>
        <p className="meta">
          اختار دورة منشورة لتظهر للطلاب في شاشة تسجيل الدخول وإنشاء الحساب.
        </p>

        <div className="tf">
          <label htmlFor="admin-auth-poster-course">الدورة المميزة</label>
          <select
            id="admin-auth-poster-course"
            value={selectedCourseId}
            disabled={poster.isLoading || courses.isLoading || poster.isSaving}
            onChange={(event) => setSelectedCourseOverride(event.target.value)}
          >
            <option value="">استخدام التصميم الافتراضي</option>
            {courses.data?.map((course) => (
              <option key={course.id} value={course.id}>
                {course.title} — {course.teacherName}
              </option>
            ))}
          </select>
        </div>

        {poster.error && (
          <p role="alert" className="error-text">
            تعذر تحميل إعدادات واجهة الدخول.
          </p>
        )}

        {courses.error && (
          <p role="alert" className="error-text">
            تعذر تحميل الدورات المنشورة.
          </p>
        )}

        <div className="actions" style={{ marginTop: 10 }}>
          <button
            type="button"
            className="btn"
            disabled={poster.isSaving || poster.isLoading || courses.isLoading}
            onClick={() => void handleSave()}
          >
            <span className="ms">save</span>
            {poster.isSaving ? 'جارٍ الحفظ...' : 'حفظ واجهة الدخول'}
          </button>
          <button
            type="button"
            className="btn text"
            disabled={poster.isSaving}
            onClick={() => setSelectedCourseOverride('')}
          >
            <span className="ms">restart_alt</span>
            الرجوع للافتراضي
          </button>
        </div>
      </div>

      <div className="auth-settings-preview">
        <TeacherPoster content={previewContent} isLoading={poster.isLoading || courses.isLoading || isPreviewLoading} />
      </div>
    </div>
  )
}
