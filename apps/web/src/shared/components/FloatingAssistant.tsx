import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useLocation } from 'react-router'
import { useAnalyticsQuestion } from '../../features/analytics/hooks/useAnalyticsQuestion'
import type { AnalyticsQuestionResponse } from '../../features/analytics/types/analytics.types'
import { getLesson } from '../../features/lessons/api/lessons.api'
import { CitationList } from '../../features/tutor/components/CitationList'
import { useTutorChat } from '../../features/tutor/hooks/useTutorChat'

interface FloatingAssistantProps {
  role: 'student' | 'teacher'
}

interface TeacherChatMessage {
  id: string
  role: 'teacher' | 'assistant'
  text: string
  failed?: boolean
}

function extractStudentCourseId(pathname: string) {
  return pathname.match(/^\/student\/courses\/([^/]+)/)?.[1] ?? null
}

function extractStudentLessonId(pathname: string) {
  return pathname.match(/^\/student\/lessons\/([^/]+)/)?.[1] ?? null
}

function formatMoney(minor: number, currency = 'EGP') {
  return `${(minor / 100).toLocaleString('ar-EG')} ${currency}`
}

function summarizeAnalyticsResponse(response: AnalyticsQuestionResponse) {
  if (response.status === 'direct') {
    return response.message
  }

  if (response.status === 'unsupported') {
    return `${response.message}\n${response.examples.join('\n')}`
  }

  const { result } = response

  if ('totalRevenue' in result) {
    return [
      `إجمالي الإيرادات: ${formatMoney(result.totalRevenue, result.currency)}`,
      `عدد الطلبات: ${result.orderCount}`,
    ].join('\n')
  }

  if ('successfulOrderCount' in result) {
    return `الطلبات الناجحة: ${result.successfulOrderCount}`
  }

  if ('bestSellers' in result) {
    if (result.bestSellers.length === 0) {
      return 'لا توجد دورات مباعة في الفترة المحددة.'
    }

    return result.bestSellers
      .map(
        (course, index) =>
          `${index + 1}. ${course.courseTitle}: ${course.orderCount} طلب - ${formatMoney(
            course.totalRevenue,
          )}`,
      )
      .join('\n')
  }

  if ('activeStudentCount' in result) {
    return [
      `الطلاب النشطون: ${result.activeStudentCount}`,
      `التسجيلات النشطة: ${result.enrollmentCount}`,
    ].join('\n')
  }

  if ('totalCourses' in result) {
    return [
      `كل الدورات: ${result.totalCourses}`,
      `منشورة: ${result.publishedCourses}`,
      `مسودات: ${result.draftCourses}`,
      `مؤرشفة: ${result.archivedCourses}`,
    ].join('\n')
  }

  return [
    `حالات متابعة نشطة: ${result.activeInterventionCount}`,
    `طلاب محتاجين متابعة: ${result.affectedStudentCount}`,
  ].join('\n')
}

function useStudentAssistantCourseId() {
  const { pathname } = useLocation()
  const courseId = extractStudentCourseId(pathname)
  const lessonId = extractStudentLessonId(pathname)
  const [lessonCourseId, setLessonCourseId] = useState<string | null>(null)

  useEffect(() => {
    if (!lessonId || courseId) {
      setLessonCourseId(null)
      return
    }

    let cancelled = false

    getLesson(lessonId, 'student')
      .then((lesson) => {
        if (!cancelled) setLessonCourseId(lesson.course.id)
      })
      .catch(() => {
        if (!cancelled) setLessonCourseId(null)
      })

    return () => {
      cancelled = true
    }
  }, [courseId, lessonId])

  return courseId ?? lessonCourseId
}

export function FloatingAssistant({ role }: FloatingAssistantProps) {
  const [isOpen, setIsOpen] = useState(false)
  const studentCourseId = useStudentAssistantCourseId()

  const title = role === 'teacher' ? 'مساعد التحليلات' : 'مساعد الدورة'
  const buttonLabel = role === 'teacher' ? 'افتح مساعد التحليلات' : 'افتح مساعد الدورة'
  const canRender = role === 'teacher' || Boolean(studentCourseId)

  if (!canRender) {
    return null
  }

  return (
    <div className="floating-assistant" dir="rtl">
      {isOpen && (
        <div className="floating-assistant-panel" role="dialog" aria-label={title}>
          <div className="floating-assistant-head">
            <div>
              <h2>{title}</h2>
              <p>
                {role === 'teacher'
                  ? 'اسأل عن طلابك ودوراتك ومبيعاتك'
                  : 'اسأل عن محتوى الدورة الحالية'}
              </p>
            </div>
            <button
              type="button"
              className="icon-btn"
              onClick={() => setIsOpen(false)}
              aria-label="إغلاق المساعد"
            >
              <span className="ms" aria-hidden="true">close</span>
            </button>
          </div>

          {role === 'teacher' ? (
            <TeacherFloatingAssistant />
          ) : (
            <StudentFloatingAssistant courseId={studentCourseId ?? ''} />
          )}
        </div>
      )}

      <button
        type="button"
        className="floating-assistant-fab"
        aria-label={isOpen ? 'إغلاق المساعد' : buttonLabel}
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
      >
        <span className="ms fill" aria-hidden="true">{isOpen ? 'close' : 'smart_toy'}</span>
      </button>
    </div>
  )
}

function StudentFloatingAssistant({ courseId }: { courseId: string }) {
  const { messages, isLoadingHistory, isSending, error, send, retryLast } = useTutorChat(courseId)
  const [draft, setDraft] = useState('')
  const messagesRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight
    }
  }, [messages.length, isSending])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const message = draft.trim()
    if (!message) return
    setDraft('')
    await send(message)
  }

  return (
    <>
      <div className="floating-assistant-messages" ref={messagesRef}>
        {isLoadingHistory && messages.length === 0 ? (
          <p className="floating-assistant-empty">جارٍ تحميل المحادثة...</p>
        ) : messages.length === 0 ? (
          <p className="floating-assistant-empty">ابدأ بسؤال من المادة المرفوعة للدورة.</p>
        ) : (
          messages.map((message) => (
            <article
              key={message.id}
              className={`floating-chat-bubble ${message.role === 'student' ? 'from-user' : 'from-assistant'}`}
            >
              <span className="ms sm">{message.role === 'student' ? 'person' : 'smart_toy'}</span>
              <div>
                <p>{message.text}</p>
                {message.status === 'no_answer' && <span className="mini-chip">بدون مصادر</span>}
                {!message.failed && message.status === 'answered' && (
                  <CitationList citations={message.citations ?? []} />
                )}
              </div>
            </article>
          ))
        )}

        {isSending && <p className="floating-assistant-empty">المساعد بيجهز الرد...</p>}
        {error && !isSending && (
          <button type="button" className="floating-retry" onClick={() => void retryLast()}>
            إعادة إرسال آخر سؤال
          </button>
        )}
      </div>

      <form className="floating-assistant-form" onSubmit={(event) => void handleSubmit(event)}>
        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          rows={2}
          maxLength={1000}
          placeholder="اسأل عن محتوى الدورة..."
          disabled={isSending || isLoadingHistory}
          aria-label="سؤالك للمساعد"
        />
        <button
          type="submit"
          className="icon-btn filled"
          disabled={!draft.trim() || isSending || isLoadingHistory}
          aria-label="إرسال السؤال"
        >
          <span className="ms" aria-hidden="true">send</span>
        </button>
      </form>
    </>
  )
}

function TeacherFloatingAssistant() {
  const { isLoading, ask } = useAnalyticsQuestion()
  const [draft, setDraft] = useState('')
  const [messages, setMessages] = useState<TeacherChatMessage[]>([])
  const messagesRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight
    }
  }, [messages.length, isLoading])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const question = draft.trim()
    if (!question || isLoading) return

    const localId = Date.now()
    setDraft('')
    setMessages((current) => [...current, { id: `teacher-${localId}`, role: 'teacher', text: question }])

    const response = await ask(question)
    setMessages((current) => [
      ...current,
      response
        ? {
            id: `assistant-${localId}`,
            role: 'assistant',
            text: summarizeAnalyticsResponse(response),
          }
        : {
            id: `assistant-failed-${localId}`,
            role: 'assistant',
            text: 'تعذر إرسال السؤال، حاول مرة أخرى',
            failed: true,
          },
    ])
  }

  return (
    <>
      <div className="floating-assistant-messages" ref={messagesRef}>
        {messages.length === 0 ? (
          <p className="floating-assistant-empty">اسألني عن الطلاب والدورات والمبيعات والمتابعات.</p>
        ) : (
          messages.map((message) => (
            <article
              key={message.id}
              className={`floating-chat-bubble ${message.role === 'teacher' ? 'from-user' : 'from-assistant'}${
                message.failed ? ' failed' : ''
              }`}
            >
              <span className="ms sm">{message.role === 'teacher' ? 'person' : 'smart_toy'}</span>
              <p>{message.text}</p>
            </article>
          ))
        )}

        {isLoading && <p className="floating-assistant-empty">جاري المعالجة...</p>}
      </div>

      <form className="floating-assistant-form" onSubmit={(event) => void handleSubmit(event)}>
        <input
          type="text"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          maxLength={500}
          placeholder="مثلاً: عندي كام طالب؟"
          disabled={isLoading}
          aria-label="سؤالك لمساعد التحليلات"
        />
        <button type="submit" className="icon-btn filled" disabled={!draft.trim() || isLoading} aria-label="إرسال السؤال">
          <span className="ms" aria-hidden="true">send</span>
        </button>
      </form>
    </>
  )
}
