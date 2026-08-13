import { useCallback, useMemo, useState } from 'react'
import { EmptyState } from '../../../shared/components/EmptyState'
import { Pagination } from '../../../shared/components/Pagination'
import { SearchField } from '../../../shared/components/SearchField'
import { usePaginatedList } from '../../../shared/hooks/usePaginatedList'
import { useDebouncedValue } from '../../../shared/hooks/useDebouncedValue'
import { ErrorState } from '../../../shared/components/ErrorState'
import { showToast } from '../../../shared/components/Toast'
import { COURSE_STATUS, ENROLLMENT_STATUS } from '../../../shared/lib/status-labels'
import { updateStudentEnrollmentStatus } from '../api/teacher.api'
import { useTeacherStudents } from '../hooks/useTeacherStudents'
import { TeacherStudentsSkeleton } from '../components/TeacherStudentsSkeleton'

type Filter = 'all' | 'subscribed' | 'unsubscribed'

const PAGE_SIZE = 10

function formatMoney(minor: number, currency: string) {
  return `${(minor / 100).toLocaleString('ar-EG')} ${currency}`
}

export function TeacherStudentsPage() {
  const [filter, setFilter] = useState<Filter>('all')
  const [studentIdSearch, setStudentIdSearch] = useState('')
  const [pendingKey, setPendingKey] = useState<string | null>(null)
  // The ID lookup is server-side (it matches a watermark code the client
  // never receives), so it has to be debounced — un-debounced it fired a
  // request per character, and each one swapped the table for a skeleton.
  const debouncedIdSearch = useDebouncedValue(studentIdSearch)

  const { data, isLoading, error, refetch } = useTeacherStudents(
    debouncedIdSearch.trim() || undefined,
  )

  async function handleToggleSuspend(
    studentId: string,
    courseId: string,
    currentStatus: 'active' | 'suspended' | 'completed',
  ) {
    if (currentStatus === 'completed') return
    const nextStatus = currentStatus === 'suspended' ? 'active' : 'suspended'
    const key = `${studentId}:${courseId}`

    setPendingKey(key)
    try {
      await updateStudentEnrollmentStatus(studentId, courseId, nextStatus)
      showToast(
        nextStatus === 'suspended'
          ? 'تم إيقاف اشتراك الطالب وإرسال إشعار له'
          : 'تم إعادة تفعيل اشتراك الطالب',
      )
      refetch()
    } catch {
      showToast('تعذر تحديث حالة الاشتراك، حاول مرة أخرى', 'error')
    } finally {
      setPendingKey(null)
    }
  }

  const students = useMemo(() => {
    if (!data) return []
    if (filter === 'subscribed') {
      return data.students.filter((student) => student.isSubscribedToAnyCourse)
    }
    if (filter === 'unsubscribed') {
      return data.students.filter((student) => !student.isSubscribedToAnyCourse)
    }
    return data.students
  }, [data, filter])

  // Name/email search is client-side on top of whatever the chip filter
  // left; the ID box above stays server-side because a student's UUID is
  // matched against columns the list response doesn't carry.
  const toHaystack = useCallback(
    (student: (typeof students)[number]) => `${student.fullName} ${student.email}`,
    [],
  )
  const list = usePaginatedList(students, toHaystack, PAGE_SIZE)

  if (isLoading) return <TeacherStudentsSkeleton />

  if (error) {
    return (
      <ErrorState
        title="تعذر تحميل الطلاب"
        message="لم نتمكن من تحميل بيانات الطلاب، جرب مرة أخرى."
        onRetry={refetch}
      />
    )
  }

  if (!data) return <EmptyState title="لا توجد بيانات" message="لا توجد بيانات طلاب حالياً" />

  return (
    <>
      <h1 className="page-title">الطلاب</h1>
      <p className="subtitle">كل الطلاب وحالة اشتراكهم في دوراتك وإجمالي المدفوع منهم</p>

      <section className="tiles section">
        <div className="tile">
          <span className="lead-ic">
            <span className="ms">groups</span>
          </span>
          <span className="lbl">كل الطلاب</span>
          <span className="num">{data.totals.studentCount}</span>
        </div>
        <div className="tile">
          <span className="lead-ic">
            <span className="ms">how_to_reg</span>
          </span>
          <span className="lbl">مشتركين</span>
          <span className="num">{data.totals.subscribedStudentCount}</span>
        </div>
        <div className="tile">
          <span className="lead-ic">
            <span className="ms">person_off</span>
          </span>
          <span className="lbl">غير مشتركين</span>
          <span className="num">{data.totals.unsubscribedStudentCount}</span>
        </div>
        <div className="tile">
          <span className="lead-ic">
            <span className="ms">payments</span>
          </span>
          <span className="lbl">إجمالي الإيراد</span>
          <span className="num" style={{ wordBreak: 'break-word' }}>
            {formatMoney(data.totals.revenueMinor, data.currency)}
          </span>
        </div>
      </section>

      <div className="tf search-field section">
        <label htmlFor="teacher-students-id-search">البحث بمعرف تتبع الفيديو (ID)</label>
        <input
          id="teacher-students-id-search"
          dir="ltr"
          value={studentIdSearch}
          onChange={(event) => setStudentIdSearch(event.target.value)}
          placeholder="الصق الكود الظاهر على الفيديو المسرّب..."
        />
      </div>

      <div className="actions section">
        {[
          { label: 'الكل', value: 'all' },
          { label: 'مشتركين', value: 'subscribed' },
          { label: 'غير مشتركين', value: 'unsubscribed' },
        ].map((option) => (
          <button
            key={option.value}
            type="button"
            className={`chip clickable outline${filter === option.value ? ' selected' : ''}`}
            aria-pressed={filter === option.value}
            onClick={() => setFilter(option.value as Filter)}
          >
            {option.label}
          </button>
        ))}
      </div>

      <SearchField
        id="teacher-students-search"
        label="بحث باسم الطالب أو بريده"
        placeholder="ابحث باسم الطالب أو بريده الإلكتروني..."
        value={list.query}
        onChange={list.search}
      />

      {list.pageItems.length === 0 ? (
        <EmptyState
          title="لا توجد نتائج"
          message={
            list.isEmptyResult
              ? 'مفيش نتائج مطابقة لبحثك، جرّب كلمة تانية'
              : 'غيّر الفلتر لعرض طلاب آخرين'
          }
        />
      ) : (
        <div className="table-wrap section">
          <table className="mtable">
            <thead>
              <tr>
                <th>الطالب</th>
                <th>ID</th>
                <th>حالة الاشتراك</th>
                <th>الكورسات</th>
                <th>إجمالي المدفوع</th>
              </tr>
            </thead>
            <tbody>
              {list.pageItems.map((student) => (
                <tr key={student.id}>
                  <td>
                    <strong>{student.fullName}</strong>
                    <span className="meta" style={{ display: 'block' }}>
                      {student.email}
                    </span>
                  </td>
                  <td>
                    <code dir="ltr">{student.id}</code>
                  </td>
                  <td>
                    <span className={`chip ${student.isSubscribedToAnyCourse ? 'green' : 'outline'}`}>
                      {student.isSubscribedToAnyCourse ? 'مشترك' : 'غير مشترك'}
                    </span>
                  </td>
                  <td>
                    {student.courses.length === 0 ? (
                      <span className="meta">لا يوجد اشتراك في دوراتك</span>
                    ) : (
                      <div className="student-course-stack">
                        {student.courses.map((course) => {
                          const courseStatus = COURSE_STATUS[course.status]
                          const enrollmentStatus = ENROLLMENT_STATUS[course.enrollmentStatus]
                          const key = `${student.id}:${course.id}`
                          const isCompleted = course.enrollmentStatus === 'completed'
                          const isSuspended = course.enrollmentStatus === 'suspended'

                          return (
                            <div key={course.id} className="student-course-pill">
                              <span>{course.title}</span>
                              <span className={`chip ${courseStatus.chip}`}>{courseStatus.label}</span>
                              <span className={`chip ${enrollmentStatus.chip}`}>{enrollmentStatus.label}</span>
                              {!isCompleted && (
                                <button
                                  type="button"
                                  className="btn text btn-compact"
                                  disabled={pendingKey === key}
                                  onClick={() =>
                                    handleToggleSuspend(student.id, course.id, course.enrollmentStatus)
                                  }
                                >
                                  {isSuspended ? 'تفعيل' : 'إيقاف'}
                                </button>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </td>
                  <td>
                    <strong>{formatMoney(student.totalRevenueMinor, data.currency)}</strong>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {list.hasPages && (
        <Pagination
          page={list.page}
          totalPages={list.totalPages}
          onPageChange={list.setPage}
          matchCount={list.matchCount}
          pageSize={PAGE_SIZE}
          itemLabel="طالب"
        />
      )}
    </>
  )
}
