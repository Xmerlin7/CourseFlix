import { useEffect, useRef, useState } from 'react'
import { ApiError } from '../../../shared/api/api-error'
import { getSettings, updateSettings } from '../api/settings.api'
import type { NotificationType } from '../../notifications/types/notification.types'
import type { ThemeMode, UpdateSettingsPayload, UserSettings } from '../types/settings.types'

interface UseSettingsResult {
  data: UserSettings | null
  isLoading: boolean
  error: ApiError | null
  isSaving: boolean
  setTheme: (theme: ThemeMode) => Promise<void>
  setNotificationPreference: (type: NotificationType, enabled: boolean) => Promise<void>
  refetch: () => void
}

export function useSettings(): UseSettingsResult {
  const [data, setData] = useState<UserSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<ApiError | null>(null)
  const [refetchToken, setRefetchToken] = useState(0)
  // True once a response has landed. Gates the skeleton — see the guard
  // inside the effect below.
  const hasLoadedRef = useRef(false)

  useEffect(() => {
    const controller = new AbortController()

    async function load() {
      // Only the first load shows a skeleton; every load after it keeps
      // the current content mounted. Swapping in a full-page skeleton
      // collapses the page height, which makes the browser reset scroll
      // to the top — that fired after every save/edit/delete, and once
      // per keystroke on the pages whose search term is part of the
      // request, where it read as the page reloading mid-word.
      if (!hasLoadedRef.current) {
        setIsLoading(true)
      }
      setError(null)

      try {
        const settings = await getSettings()
        if (!controller.signal.aborted) {
          setData(settings)
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(err instanceof ApiError ? err : new ApiError('Unknown error', 0))
        }
      } finally {
        if (!controller.signal.aborted) {
          hasLoadedRef.current = true
          setIsLoading(false)
        }
      }
    }

    void load()

    return () => controller.abort()
  }, [refetchToken])

  // Shared by setTheme/setNotificationPreference: applies the payload
  // optimistically so a toggle flips instantly, and rolls back to the
  // pre-save snapshot if the PATCH fails.
  async function save(payload: UpdateSettingsPayload, optimistic: UserSettings) {
    const previous = data
    setData(optimistic)
    setIsSaving(true)
    try {
      const saved = await updateSettings(payload)
      setData(saved)
    } catch (err) {
      setData(previous)
      throw err
    } finally {
      setIsSaving(false)
    }
  }

  // Doesn't require `data` to already be loaded — a theme click can land
  // before the initial GET resolves, and the PATCH shouldn't be dropped
  // just because there's nothing to optimistically merge onto yet.
  async function setTheme(theme: ThemeMode) {
    const optimistic: UserSettings = data
      ? { ...data, theme }
      : { theme, notificationPreferences: {} }
    await save({ theme }, optimistic)
  }

  async function setNotificationPreference(type: NotificationType, enabled: boolean) {
    if (!data) return
    await save(
      { notificationPreferences: { [type]: enabled } },
      { ...data, notificationPreferences: { ...data.notificationPreferences, [type]: enabled } },
    )
  }

  return {
    data,
    isLoading,
    error,
    isSaving,
    setTheme,
    setNotificationPreference,
    refetch: () => setRefetchToken((token) => token + 1),
  }
}
