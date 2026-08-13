import { useEffect, useState } from 'react'

/**
 * Trails `value` by `delayMs`, resetting the timer on every change.
 *
 * Used to keep search boxes off the network on every keystroke: the
 * search-backed list hooks re-run whenever their term changes, so typing
 * "عبدالله" un-debounced fired seven requests, and the last one to
 * *arrive* won rather than the last one sent.
 *
 * 300ms is the usual sweet spot — long enough to swallow a normal typing
 * cadence, short enough that the results feel like they follow the
 * keyboard rather than lagging behind it.
 */
export function useDebouncedValue<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(timer)
  }, [value, delayMs])

  return debounced
}
