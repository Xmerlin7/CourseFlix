import { useMemo, useState } from 'react'
import { showToast } from '../../../shared/components/Toast'
import { TeacherPoster } from '../../auth/components/TeacherPoster'
import { useAuth } from '../../auth/hooks/useAuth'
import { useTeacherAuthPoster } from '../../auth/hooks/useTeacherAuthPoster'
import {
  DEFAULT_AUTH_POSTER_CUSTOMIZATION,
  type AuthPosterContent,
  type AuthPosterCustomization,
} from '../../auth/types/auth-poster.types'
import { useTeacherCourses } from '../../teacher/hooks/useTeacherCourses'

const CUSTOMIZATION_FIELDS: Array<{
  key: keyof AuthPosterCustomization
  label: string
  placeholder: string
}> = [
  { key: 'badgeText', label: 'نص شارة البطاقة', placeholder: 'منصة تعليم تفاعلية' },
  { key: 'teacherPrefix', label: 'النص قبل اسم المدرّس', placeholder: 'مع الأستاذ' },
  { key: 'studyPlanValue', label: 'قيمة خطة المذاكرة', placeholder: '١٢ أسبوع' },
  { key: 'studyPlanLabel', label: 'عنوان خطة المذاكرة', placeholder: 'خطة مذاكرة' },
  { key: 'quizValue', label: 'قيمة الاختبارات', placeholder: '٤٨ تدريب' },
  { key: 'quizLabel', label: 'عنوان الاختبارات', placeholder: 'اختبارات قصيرة' },
  { key: 'followUpValue', label: 'قيمة المتابعة', placeholder: 'كل حصة' },
  { key: 'followUpLabel', label: 'عنوان المتابعة', placeholder: 'متابعة تقدم' },
  { key: 'journeyLabel', label: 'عنوان شريط التقدم', placeholder: 'رحلة الطالب' },
]

export function TeacherAuthPosterSettingsForm() {
  const { user } = useAuth()
  const poster = useTeacherAuthPoster()
  const courses = useTeacherCourses({ status: 'published' })
  const [selectedCourseOverride, setSelectedCourseOverride] = useState<string>()
  const [customizationOverride, setCustomizationOverride] = useState<
    Partial<AuthPosterCustomization>
  >({})
  const selectedCourseId =
    selectedCourseOverride ?? poster.data?.featuredCourseId ?? ''
  const customization: AuthPosterCustomization = {
    ...DEFAULT_AUTH_POSTER_CUSTOMIZATION,
    ...poster.data?.customization,
    ...customizationOverride,
  }
  const hasEmptyCustomization = Object.values(customization).some(
    (value) => !value.trim(),
  )

  const selectedCourse = useMemo(
    () => courses.data.find((course) => course.id === selectedCourseId) ?? null,
    [courses.data, selectedCourseId],
  )

  const previewContent: AuthPosterContent | null = selectedCourse
    ? {
        featuredCourseId: selectedCourse.id,
        isFallback: false,
        customization,
        course: {
          id: selectedCourse.id,
          title: selectedCourse.title,
          description: selectedCourse.description,
          coverImageUrl: selectedCourse.coverImageUrl,
          gradeLevel: selectedCourse.gradeLevel,
          teacherName: user?.fullName ?? poster.data?.course.teacherName ?? '',
        },
      }
    : poster.data
      ? { ...poster.data, customization }
      : null

  async function handleSave() {
    try {
      await poster.saveFeaturedCourse(selectedCourseId || null, customization)
      showToast('تم تحديث واجهة الدخول بنجاح', 'success')
    } catch {
      showToast('تعذر تحديث واجهة الدخول، اختر دورة منشورة من دوراتك', 'error')
    }
  }

  return (
    <div className="settings-cards-grid">
      <div className="card settings-card">
        <h3 style={{ marginBottom: 0 }}>الدورة الظاهرة في واجهة الدخول</h3>
        <p className="meta">
          اختر دورة منشورة من دوراتك لتظهر في شاشة تسجيل الدخول وإنشاء الحساب.
        </p>

        <div className="tf">
          <label htmlFor="teacher-auth-poster-course">الدورة المميزة</label>
          <select
            id="teacher-auth-poster-course"
            value={selectedCourseId}
            disabled={poster.isLoading || courses.isLoading || poster.isSaving}
            onChange={(event) => setSelectedCourseOverride(event.target.value)}
          >
            <option value="">استخدام التصميم الافتراضي</option>
            {courses.data.map((course) => (
              <option key={course.id} value={course.id}>
                {course.title}
              </option>
            ))}
          </select>
        </div>

        <section className="auth-copy-customizer" aria-labelledby="auth-copy-title">
          <div className="auth-copy-heading">
            <div>
              <h4 id="auth-copy-title">تخصيص نصوص البطاقة</h4>
              <p className="meta">
                غيّر القيم والعناوين، وستظهر النتيجة مباشرة في المعاينة.
              </p>
            </div>
            <button
              type="button"
              className="btn text"
              disabled={poster.isSaving}
              onClick={() => setCustomizationOverride(DEFAULT_AUTH_POSTER_CUSTOMIZATION)}
            >
              <span className="ms">refresh</span>
              استعادة النصوص
            </button>
          </div>

          <div className="auth-copy-fields">
            {CUSTOMIZATION_FIELDS.map((field) => (
              <div className="tf" key={field.key}>
                <label htmlFor={`auth-copy-${field.key}`}>{field.label}</label>
                <input
                  id={`auth-copy-${field.key}`}
                  value={customization[field.key]}
                  placeholder={field.placeholder}
                  maxLength={80}
                  required
                  dir="auto"
                  disabled={poster.isLoading || poster.isSaving}
                  onChange={(event) =>
                    setCustomizationOverride((current) => ({
                      ...current,
                      [field.key]: event.target.value,
                    }))
                  }
                />
              </div>
            ))}
          </div>
          {hasEmptyCustomization && (
            <p role="alert" className="error-text">لا يمكن ترك أي نص فارغًا.</p>
          )}
        </section>

        {poster.error && (
          <p role="alert" className="error-text">تعذر تحميل إعدادات واجهة الدخول.</p>
        )}
        {courses.error && (
          <p role="alert" className="error-text">تعذر تحميل دوراتك المنشورة.</p>
        )}

        <div className="actions" style={{ marginTop: 10 }}>
          <button
            type="button"
            className="btn"
            disabled={
              poster.isSaving ||
              poster.isLoading ||
              courses.isLoading ||
              hasEmptyCustomization
            }
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
        <TeacherPoster
          content={previewContent}
          isLoading={poster.isLoading || courses.isLoading}
        />
      </div>
    </div>
  )
}
