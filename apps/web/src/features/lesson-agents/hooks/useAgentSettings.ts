import { useEffect, useState } from 'react'
import { ApiError } from '../../../shared/api/api-error'
import { getAgentSettings, updateAgentSettings } from '../api/lesson-agents.api'
import type { AgentSettings, UpdateAgentSettingsPayload } from '../types/lesson-agents.types'

interface UseAgentSettingsResult {
  data: AgentSettings | null
  isLoading: boolean
  isSaving: boolean
  error: ApiError | null
  save: (payload: UpdateAgentSettingsPayload) => Promise<void>
  refetch: () => void
}

/**
 * The teacher's agent preferences. `save` sends only the changed keys —
 * the API merges them onto what's stored, so a single toggle can't reset
 * the other eleven settings.
 */
export function useAgentSettings(): UseAgentSettingsResult {
  const [data, setData] = useState<AgentSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<ApiError | null>(null)
  const [refetchToken, setRefetchToken] = useState(0)

  useEffect(() => {
    const controller = new AbortController()

    async function load() {
      setError(null)
      try {
        const settings = await getAgentSettings()
        if (!controller.signal.aborted) {
          setData(settings)
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
  }, [refetchToken])

  async function save(payload: UpdateAgentSettingsPayload) {
    setIsSaving(true)
    try {
      setData(await updateAgentSettings(payload))
    } finally {
      setIsSaving(false)
    }
  }

  return {
    data,
    isLoading,
    isSaving,
    error,
    save,
    refetch: () => setRefetchToken((token) => token + 1),
  }
}
