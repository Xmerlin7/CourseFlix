import { useState } from 'react'
import type { FormEvent } from 'react'
import { ApiError } from '../../../shared/api/api-error'
import { updateTeacherCourse } from '../api/teacher.api'
import type { TeacherCourse } from '../types/teacher.types'

interface TeacherCourseFormProps {
  course: TeacherCourse
  onSaved?: (course: TeacherCourse) => void
}

export function TeacherCourseForm({ course, onSaved }: TeacherCourseFormProps) {
  const [title, setTitle] = useState(course.title)
  const [description, setDescription] = useState(course.description ?? '')
  const [coverImageUrl, setCoverImageUrl] = useState(course.coverImageUrl ?? '')
  const [gradeLevel, setGradeLevel] = useState(course.gradeLevel ?? '')
  const [status, setStatus] = useState<'draft' | 'published'>(
    course.status === 'archived' ? 'draft' : course.status,
  )
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [savedAt, setSavedAt] = useState<number | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSaving(true)
    setError(null)

    try {
      const updated = await updateTeacherCourse(course.id, {
        title,
        description: description || null,
        coverImageUrl: coverImageUrl || null,
        gradeLevel: gradeLevel || null,
        status,
      })
      setSavedAt(Date.now())
      onSaved?.(updated)
    } catch (err) {
      if (err instanceof ApiError && err.status === 400) {
        setError('البيانات المدخلة غير صحيحة، راجع الحقول وحاول مرة أخرى')
      } else {
        setError('تعذر حفظ التعديلات، حاول مرة أخرى')
      }
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form
      onSubmit={(event) => void handleSubmit(event)}
      className="flex flex-col gap-4 rounded-xl border border-gray-200 p-4 dark:border-gray-700"
      dir="rtl"
    >
      <h3 className="font-semibold text-gray-900 dark:text-gray-100">
        تعديل بيانات الكورس
      </h3>

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-gray-600 dark:text-gray-400">العنوان</span>
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          minLength={3}
          maxLength={150}
          required
          className="rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-800"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-gray-600 dark:text-gray-400">الوصف</span>
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          maxLength={5000}
          rows={4}
          className="rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-800"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-gray-600 dark:text-gray-400">رابط صورة الغلاف</span>
        <input
          value={coverImageUrl}
          onChange={(event) => setCoverImageUrl(event.target.value)}
          type="url"
          placeholder="https://..."
          className="rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-800"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-gray-600 dark:text-gray-400">الصف الدراسي</span>
        <input
          value={gradeLevel}
          onChange={(event) => setGradeLevel(event.target.value)}
          maxLength={100}
          className="rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-800"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm sm:w-48">
        <span className="text-gray-600 dark:text-gray-400">الحالة</span>
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value as 'draft' | 'published')}
          className="rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-800"
        >
          <option value="draft">مسودة</option>
          <option value="published">منشورة</option>
        </select>
      </label>

      {error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}

      {savedAt && !error && (
        <p role="status" className="text-sm text-emerald-600 dark:text-emerald-400">
          تم حفظ التعديلات بنجاح
        </p>
      )}

      <button
        type="submit"
        disabled={isSaving}
        className="w-fit rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {isSaving ? 'جارٍ الحفظ...' : 'حفظ التعديلات'}
      </button>
    </form>
  )
}
