import { useCallback, useState } from 'react'
import { ApiError } from '../../../shared/api/api-error'
import { sendTutorMessage } from '../api/tutor.api'
import type { TutorChatMessage } from '../types/tutor.types'

interface UseTutorChatResult {
  messages: TutorChatMessage[]
  isSending: boolean
  error: ApiError | null
  send: (message: string) => Promise<void>
  retryLast: () => Promise<void>
}

export function useTutorChat(courseId: string): UseTutorChatResult {
  const [messages, setMessages] = useState<TutorChatMessage[]>([])
  const [lastFailedMessage, setLastFailedMessage] = useState<string | null>(null)
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<ApiError | null>(null)

  const send = useCallback(async (rawMessage: string) => {
    const message = rawMessage.trim()
    if (!message || isSending) return

    setError(null)
    setIsSending(true)
    setLastFailedMessage(null)

    const localId = `local-${Date.now()}`
    setMessages((current) => [
      ...current,
      { id: localId, role: 'student', text: message },
    ])

    try {
      const response = await sendTutorMessage(courseId, { message })
      setMessages((current) => [
        ...current,
        {
          id: response.messageId,
          role: 'assistant',
          text: response.answer,
          status: response.status,
          citations: response.citations,
        },
      ])
    } catch (caughtError) {
      const apiError =
        caughtError instanceof ApiError
          ? caughtError
          : new ApiError('Unknown error', 0)
      setError(apiError)
      setLastFailedMessage(message)
      setMessages((current) => [
        ...current,
        {
          id: `failed-${Date.now()}`,
          role: 'assistant',
          text: 'تعذر إرسال السؤال، حاول مرة أخرى',
          failed: true,
        },
      ])
    } finally {
      setIsSending(false)
    }
  }, [courseId, isSending])

  const retryLast = useCallback(async () => {
    if (lastFailedMessage) {
      await send(lastFailedMessage)
    }
  }, [lastFailedMessage, send])

  return { messages, isSending, error, send, retryLast }
}
