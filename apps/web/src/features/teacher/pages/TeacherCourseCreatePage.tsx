import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { ApiError } from '../../../shared/api/api-error'
import { createTeacherCourse } from '../api/teacher.api'

export function TeacherCourseCreatePage() {
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [coverImageUrl, setCoverImageUrl] = useState('')
  const [gradeLevel, setGradeLevel] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSaving(true)
    setError(null)

    try {
      const course = await createTeacherCourse({
        title,
        description: description || null,
        coverImageUrl: coverImageUrl || null,
        gradeLevel: gradeLevel || null,
      })
      navigate(`/teacher/courses/${course.id}`, { replace: true })
    } catch (caughtError) {
      setError(
        caughtError instanceof ApiError && caughtError.status === 400
          ? 'البيانات المدخلة غير صحيحة، راجع الحقول وحاول مرة أخرى'
          : 'تعذر إنشاء الدورة، حاول مرة أخرى',
      )
      setIsSaving(false)
    }
  }

  return (
    <>
      <h1 className="page-title">دورة جديدة</h1>
      <p className="subtitle">
        هتتحفظ كمسودة، وتقدر تضيف الأقسام والدروس وتنشرها بعد كده
      </p>

      <form onSubmit={(event) => void handleSubmit(event)} className="card" style={{ maxWidth: 520 }}>
        <div className="tf">
          <label htmlFor="new-course-title">العنوان</label>
          <input
            id="new-course-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            minLength={3}
            maxLength={150}
            required
            autoFocus
          />
        </div>

        <div className="tf">
          <label htmlFor="new-course-description">الوصف</label>
          <textarea
            id="new-course-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            maxLength={5000}
            rows={4}
          />
        </div>

        <div className="tf">
          <label htmlFor="new-course-cover">رابط صورة الغلاف</label>
          <input
            id="new-course-cover"
            value={coverImageUrl}
            onChange={(event) => setCoverImageUrl(event.target.value)}
            type="url"
            placeholder="https://..."
          />
        </div>

        <div className="tf">
          <label htmlFor="new-course-grade">الصف الدراسي</label>
          <input
            id="new-course-grade"
            value={gradeLevel}
            onChange={(event) => setGradeLevel(event.target.value)}
            maxLength={100}
            placeholder="مثال: الصف الثالث الثانوي"
          />
        </div>

        {error && (
          <p role="alert" style={{ color: 'var(--error)', fontSize: 13.5, fontWeight: 600 }}>
            {error}
          </p>
        )}

        <div className="actions">
          <button type="submit" disabled={isSaving} className="btn">
            <span className="ms">add</span>
            {isSaving ? 'جارٍ الإنشاء...' : 'إنشاء الدورة'}
          </button>
          <button type="button" className="btn text" onClick={() => navigate(-1)}>
            إلغاء
          </button>
        </div>
      </form>
    </>
  )
}
