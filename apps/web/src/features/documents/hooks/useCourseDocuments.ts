import { useEffect, useState } from 'react'
import { ApiError } from '../../../shared/api/api-error'
import { getCourseDocuments, retryDocument, uploadCourseDocument } from '../api/documents.api'
import type { CourseDocument } from '../types/document.types'

const POLL_INTERVAL_MS = 5000

interface UseCourseDocumentsResult {
  data: CourseDocument[]
  isLoading: boolean
  error: ApiError | null
  upload: (file: File) => Promise<void>
  retry: (documentId: string) => Promise<void>
  refetch: () => void
}

// NOTE: plain useEffect/useState, matching useTeacherCourses.ts — no
// data-fetching library is installed in apps/web yet. The refetch caused by
// polling below is silent (isLoading only flips on the very first load), so
// the list doesn't flicker into a loading state every 5s.
export function useCourseDocuments(courseId: string): UseCourseDocumentsResult {
  const [data, setData] = useState<CourseDocument[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<ApiError | null>(null)
  const [refetchToken, setRefetchToken] = useState(0)

  const hasPendingWork = data.some(
    (doc) => doc.processingStatus === 'pending' || doc.processingStatus === 'processing',
  )

  useEffect(() => {
    const controller = new AbortController()

    async function load() {
      setError(null)

      try {
        const documents = await getCourseDocuments(courseId)
        if (!controller.signal.aborted) {
          setData(documents)
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(err instanceof ApiError ? err : new ApiError('Unknown error', 0))
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    void load()

    return () => controller.abort()
  }, [courseId, refetchToken])

  // Poll only while something is still being worked on server-side.
  useEffect(() => {
    if (!hasPendingWork) {
      return
    }

    const timer = setInterval(() => {
      setRefetchToken((token) => token + 1)
    }, POLL_INTERVAL_MS)

    return () => clearInterval(timer)
  }, [hasPendingWork])

  async function upload(file: File) {
    await uploadCourseDocument(courseId, file)
    setRefetchToken((token) => token + 1)
  }

  async function retry(documentId: string) {
    await retryDocument(documentId)
    setRefetchToken((token) => token + 1)
  }

  return {
    data,
    isLoading,
    error,
    upload,
    retry,
    refetch: () => setRefetchToken((token) => token + 1),
  }
}
