import { useCallback, useEffect, useMemo, useState } from 'react'

/**
 * Client-side search + pagination over an already-loaded array.
 *
 * Deliberately client-side: every list endpoint in this app returns the
 * full collection in one response and none of them accept `page`/`limit`,
 * so paginating on the server would mean touching every controller,
 * service and hook first. Doing it here gets the same result for the user
 * — a bounded page with a search box — without a backend change, and the
 * hook's shape is the one a server-driven version would expose too, so
 * the swap stays local if these collections ever outgrow one response.
 *
 * @param items      The full list. `null`/`undefined` while loading —
 *                   both, because the data hooks in this app return
 *                   `null` before the first response and callers
 *                   shouldn't have to normalise that at every call site.
 * @param toHaystack Builds the searchable text for one item. Return every
 *                   field a user might type — the match is a plain
 *                   case-insensitive substring test over the joined
 *                   result. Must be stable (wrap in useCallback) or the
 *                   filter recomputes every render.
 * @param pageSize   Rows per page.
 * @param serverQuery Pass the page's own search term when the *endpoint*
 *                   already filters (admin users and courses both accept
 *                   a `search` param, and both search fields the client
 *                   can't see — a user's UUID, for one). Client-side
 *                   filtering is then skipped, since the rows have
 *                   already been narrowed; the value is only used to send
 *                   the reader back to page 1 when the term changes.
 */
export function usePaginatedList<T>(
  items: T[] | null | undefined,
  toHaystack: (item: T) => string,
  pageSize = 10,
  serverQuery?: string,
) {
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)

  const isServerFiltered = serverQuery !== undefined

  const filtered = useMemo(() => {
    if (!items) return []
    if (isServerFiltered) return items
    const needle = normalize(query)
    if (!needle) return items
    return items.filter((item) => normalize(toHaystack(item)).includes(needle))
  }, [items, query, toHaystack, isServerFiltered])

  useEffect(() => {
    if (isServerFiltered) setPage(1)
  }, [serverQuery, isServerFiltered])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))

  // Clamp instead of resetting to 1: deleting the last row of the last
  // page should land on the new last page, not throw the user back to the
  // top of the list. Typing in the search box resets separately, below.
  useEffect(() => {
    setPage((current) => Math.min(current, totalPages))
  }, [totalPages])

  const pageItems = useMemo(
    () => filtered.slice((page - 1) * pageSize, page * pageSize),
    [filtered, page, pageSize],
  )

  const search = useCallback((value: string) => {
    setQuery(value)
    // A new query re-slices the list, so whatever page number was showing
    // no longer refers to anything the user asked for.
    setPage(1)
  }, [])

  return {
    query,
    /** Sets the query and returns to page 1. */
    search,
    page,
    setPage,
    totalPages,
    /** Rows for the current page only. */
    pageItems,
    /** How many rows survived the search (not how many pages). */
    matchCount: filtered.length,
    /** How many rows there were before searching. */
    totalCount: items?.length ?? 0,
    /** True when a query is active but nothing matched. */
    isEmptyResult: filtered.length === 0 && Boolean(items?.length),
    /** Whether the pager is worth rendering at all. */
    hasPages: totalPages > 1,
  }
}

/**
 * Arabic needs more than `toLowerCase()` to make search feel right:
 * users type ا for أ/إ/آ, ه for ة and ي for ى all the time, and Arabic
 * text on the web frequently carries diacritics or tatweel the user will
 * never reproduce in a search box. Folding both sides through this makes
 * "احمد" find "أحمد".
 */
function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/[ً-ٰٟـ]/g, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .trim()
}
