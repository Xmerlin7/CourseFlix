interface PaginationProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  /** Total rows behind the pager, used for the "من N" count. */
  matchCount: number
  /** Rows per page — only needed to phrase the range text. */
  pageSize: number
  /** What the rows are, for the count line, e.g. "طالب". */
  itemLabel?: string
}

/**
 * Page controls for the client-side pager (usePaginatedList).
 *
 * The chevrons point the RTL way round on purpose: `chevron_right` moves
 * to the *previous* page because in a right-to-left reading order the
 * earlier page sits to the right. Using the Latin arrangement here made
 * the buttons feel inverted to every Arabic reader who tried it.
 *
 * Page numbers are windowed rather than listed in full — a 40-page list
 * would otherwise emit 40 buttons and wrap onto four rows on a phone.
 */
export function Pagination({
  page,
  totalPages,
  onPageChange,
  matchCount,
  pageSize,
  itemLabel = 'عنصر',
}: PaginationProps) {
  if (totalPages <= 1) return null

  const first = (page - 1) * pageSize + 1
  const last = Math.min(page * pageSize, matchCount)

  return (
    <nav className="pager" aria-label="تنقل بين الصفحات">
      <p className="pager-count">
        {first}–{last} من {matchCount} {itemLabel}
      </p>

      <div className="pager-controls">
        <button
          type="button"
          className="pager-btn"
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          aria-label="الصفحة السابقة"
        >
          <span className="ms">chevron_right</span>
        </button>

        {pageWindow(page, totalPages).map((entry, index) =>
          entry === 'gap' ? (
            <span key={`gap-${index}`} className="pager-gap" aria-hidden="true">
              …
            </span>
          ) : (
            <button
              key={entry}
              type="button"
              className={`pager-btn${entry === page ? ' selected' : ''}`}
              onClick={() => onPageChange(entry)}
              aria-label={`الصفحة ${entry}`}
              aria-current={entry === page ? 'page' : undefined}
            >
              {entry}
            </button>
          ),
        )}

        <button
          type="button"
          className="pager-btn"
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          aria-label="الصفحة التالية"
        >
          <span className="ms">chevron_left</span>
        </button>
      </div>
    </nav>
  )
}

/**
 * First page, last page, the current page and its neighbours, with gaps
 * standing in for the rest. Caps the control at seven slots so it fits on
 * a 412px-wide phone without wrapping.
 */
function pageWindow(page: number, totalPages: number): (number | 'gap')[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1)
  }

  const pages = new Set([1, totalPages, page, page - 1, page + 1])
  // Keep the control a fixed width near the ends, where the window would
  // otherwise be lopsided (page 1 shows 1,2 and nothing on the left).
  if (page <= 3) [2, 3, 4].forEach((n) => pages.add(n))
  if (page >= totalPages - 2) {
    [totalPages - 1, totalPages - 2, totalPages - 3].forEach((n) => pages.add(n))
  }

  const sorted = [...pages].filter((n) => n >= 1 && n <= totalPages).sort((a, b) => a - b)

  const result: (number | 'gap')[] = []
  let previous = 0
  for (const current of sorted) {
    if (previous && current - previous > 1) result.push('gap')
    result.push(current)
    previous = current
  }
  return result
}
