import { useEffect, useRef, useState, type CSSProperties } from 'react'

interface DatePickerProps {
  id: string
  label?: string
  value: string // 'YYYY-MM-DD' or ''
  onChange: (value: string) => void
  placeholder?: string
}

const ARABIC_MONTHS = [
  'يناير',
  'فبراير',
  'مارس',
  'أبريل',
  'مايو',
  'يونيو',
  'يوليو',
  'أغسطس',
  'سبتمبر',
  'أكتوبر',
  'نوفمبر',
  'ديسمبر',
]

const ARABIC_WEEKDAYS = ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت']

function formatArabicDateDisplay(isoDate: string): string {
  if (!isoDate) return ''
  const [year, month, day] = isoDate.split('-').map(Number)
  if (!year || !month || !day) return isoDate
  const monthName = ARABIC_MONTHS[month - 1] ?? month
  return `${day} ${monthName} ${year}`
}

function getDaysInMonth(year: number, monthIndex: number): number {
  return new Date(year, monthIndex + 1, 0).getDate()
}

function getFirstDayOfWeek(year: number, monthIndex: number): number {
  return new Date(year, monthIndex, 1).getDay()
}

function toIsoString(year: number, monthIndex: number, day: number): string {
  const m = String(monthIndex + 1).padStart(2, '0')
  const d = String(day).padStart(2, '0')
  return `${year}-${m}-${d}`
}

// Clickable header label (month name / year) — reset to look like plain
// bold text, not a button, until hovered/focused.
const headerLabelButtonStyle: CSSProperties = {
  background: 'none',
  border: 'none',
  padding: '2px 4px',
  borderRadius: 6,
  font: 'inherit',
  fontWeight: 700,
  color: 'var(--on-surface)',
  cursor: 'pointer',
}

// Shared cell styling for the month/year grids — mirrors the day-cell
// selected/today treatment so switching grids feels like the same control.
function gridCellStyle(isSelected: boolean, isCurrent: boolean): CSSProperties {
  return {
    height: 36,
    borderRadius: 8,
    border: isCurrent && !isSelected ? '1.5px solid var(--primary)' : 'none',
    background: isSelected
      ? 'var(--primary)'
      : isCurrent
        ? 'var(--primary-container)'
        : 'transparent',
    color: isSelected
      ? 'var(--on-primary)'
      : isCurrent
        ? 'var(--on-primary-container)'
        : 'var(--on-surface)',
    fontWeight: isSelected || isCurrent ? 700 : 500,
    fontSize: 12.5,
    cursor: 'pointer',
    display: 'grid',
    placeItems: 'center',
    transition: 'background 0.15s',
  }
}

// Approximate rendered height of the open dropdown (days grid + header +
// weekday row + footer) — used to decide whether it fits below the field.
const ESTIMATED_DROPDOWN_HEIGHT = 300

type PickerMode = 'days' | 'months' | 'years'
const YEARS_PER_PAGE = 12

export function DatePicker({
  id,
  label,
  value,
  onChange,
  placeholder = 'اختر التاريخ...',
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [openDirection, setOpenDirection] = useState<'down' | 'up'>('down')
  const [pickerMode, setPickerMode] = useState<PickerMode>('days')
  const containerRef = useRef<HTMLDivElement>(null)

  // Calendar view state (year and monthIndex 0..11)
  const initialDate = value ? new Date(value) : new Date()
  const validInitial = Number.isNaN(initialDate.getTime()) ? new Date() : initialDate
  const [viewYear, setViewYear] = useState(validInitial.getFullYear())
  const [viewMonth, setViewMonth] = useState(validInitial.getMonth())

  // Keep view in sync when value changes
  useEffect(() => {
    if (value) {
      const parsed = new Date(value)
      if (!Number.isNaN(parsed.getTime())) {
        setViewYear(parsed.getFullYear())
        setViewMonth(parsed.getMonth())
      }
    }
  }, [value])

  // Re-check available space every time the dropdown opens, so it flips
  // side correctly if the page has scrolled since it last opened.
  useEffect(() => {
    if (!isOpen) return
    const container = containerRef.current
    if (!container) return
    const rect = container.getBoundingClientRect()
    const spaceBelow = window.innerHeight - rect.bottom
    const spaceAbove = rect.top
    setOpenDirection(
      spaceBelow < ESTIMATED_DROPDOWN_HEIGHT && spaceAbove > spaceBelow ? 'up' : 'down',
    )
  }, [isOpen])

  // Every path that closes the dropdown also resets it back to the day
  // grid, so it never reopens mid drill-down into months/years.
  const closeDropdown = () => {
    setIsOpen(false)
    setPickerMode('days')
  }

  const toggleDropdown = () => {
    if (isOpen) closeDropdown()
    else setIsOpen(true)
  }

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        closeDropdown()
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        closeDropdown()
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11)
      setViewYear((y) => y - 1)
    } else {
      setViewMonth((m) => m - 1)
    }
  }

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0)
      setViewYear((y) => y + 1)
    } else {
      setViewMonth((m) => m + 1)
    }
  }

  const yearsPageStart = Math.floor(viewYear / YEARS_PER_PAGE) * YEARS_PER_PAGE
  const yearsPageEnd = yearsPageStart + YEARS_PER_PAGE - 1

  // Header prev/next steps by day-month, by year, or by a page of years,
  // depending on which grid is currently shown.
  const handleHeaderPrev = () => {
    if (pickerMode === 'days') prevMonth()
    else if (pickerMode === 'months') setViewYear((y) => y - 1)
    else setViewYear((y) => y - YEARS_PER_PAGE)
  }

  const handleHeaderNext = () => {
    if (pickerMode === 'days') nextMonth()
    else if (pickerMode === 'months') setViewYear((y) => y + 1)
    else setViewYear((y) => y + YEARS_PER_PAGE)
  }

  const daysInMonth = getDaysInMonth(viewYear, viewMonth)
  const firstDay = getFirstDayOfWeek(viewYear, viewMonth)

  const todayIso = new Date().toISOString().split('T')[0]
  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth()

  const handleSelectDay = (day: number) => {
    const selectedIso = toIsoString(viewYear, viewMonth, day)
    onChange(selectedIso)
    closeDropdown()
  }

  const handleSelectMonth = (monthIndex: number) => {
    setViewMonth(monthIndex)
    setPickerMode('days')
  }

  const handleSelectYear = (year: number) => {
    setViewYear(year)
    setPickerMode('months')
  }

  const handleClear = () => {
    onChange('')
    closeDropdown()
  }

  return (
    <div className="tf" style={{ position: 'relative', marginBottom: 0 }} ref={containerRef}>
      {label && <label htmlFor={id}>{label}</label>}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <input
          id={id}
          type="text"
          readOnly
          value={value ? formatArabicDateDisplay(value) : ''}
          placeholder={placeholder}
          onClick={toggleDropdown}
          aria-expanded={isOpen}
          aria-haspopup="dialog"
          style={{
            cursor: 'pointer',
            paddingInlineEnd: '42px',
          }}
        />
        <button
          type="button"
          onClick={toggleDropdown}
          aria-label={label ? `فتح تقويم ${label}` : 'فتح التقويم'}
          style={{
            position: 'absolute',
            insetInlineEnd: '12px',
            background: 'none',
            border: 'none',
            color: 'var(--on-surface-variant)',
            cursor: 'pointer',
            display: 'grid',
            placeItems: 'center',
            padding: 4,
          }}
        >
          <span className="ms" style={{ fontSize: 20 }}>
            calendar_today
          </span>
        </button>
      </div>

      {isOpen && (
        <div
          role="dialog"
          aria-label="اختيار التاريخ"
          style={{
            position: 'absolute',
            ...(openDirection === 'up'
              ? { bottom: 'calc(100% + 6px)' }
              : { top: 'calc(100% + 6px)' }),
            insetInlineStart: 0,
            zIndex: 100,
            width: 'min(270px, calc(100vw - 24px))',
            maxHeight: 'min(380px, 80vh)',
            overflowY: 'auto',
            background: 'var(--surface-container-high)',
            border: '1px solid var(--outline-variant)',
            borderRadius: 16,
            padding: 12,
            boxShadow: 'var(--shadow-lg)',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
          dir="rtl"
        >
          {/* Calendar Header — the label doubles as a shortcut into the
              month/year grids, so jumping across years doesn't mean
              clicking the arrow dozens of times. */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 8,
            }}
          >
            <button
              type="button"
              className="icon-btn"
              onClick={handleHeaderPrev}
              aria-label={
                pickerMode === 'days'
                  ? 'الشهر السابق'
                  : pickerMode === 'months'
                    ? 'السنة السابقة'
                    : 'الفترة السابقة'
              }
              style={{ width: 32, height: 32 }}
            >
              <span className="ms">chevron_right</span>
            </button>

            {pickerMode === 'days' && (
              <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--on-surface)' }}>
                <button
                  type="button"
                  onClick={() => setPickerMode('months')}
                  aria-label="اختيار الشهر"
                  style={headerLabelButtonStyle}
                >
                  {ARABIC_MONTHS[viewMonth]}
                </button>{' '}
                <button
                  type="button"
                  onClick={() => setPickerMode('years')}
                  aria-label="اختيار السنة"
                  style={headerLabelButtonStyle}
                >
                  {viewYear}
                </button>
              </span>
            )}

            {pickerMode === 'months' && (
              <button
                type="button"
                onClick={() => setPickerMode('years')}
                aria-label="اختيار السنة"
                style={{ ...headerLabelButtonStyle, fontSize: 15 }}
              >
                {viewYear}
              </button>
            )}

            {pickerMode === 'years' && (
              <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--on-surface)' }}>
                {yearsPageStart} - {yearsPageEnd}
              </span>
            )}

            <button
              type="button"
              className="icon-btn"
              onClick={handleHeaderNext}
              aria-label={
                pickerMode === 'days'
                  ? 'الشهر التالي'
                  : pickerMode === 'months'
                    ? 'السنة التالية'
                    : 'الفترة التالية'
              }
              style={{ width: 32, height: 32 }}
            >
              <span className="ms">chevron_left</span>
            </button>
          </div>

          {pickerMode === 'days' && (
            <>
              {/* Weekday Labels */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(7, 1fr)',
                  gap: 4,
                  textAlign: 'center',
                  fontSize: 12,
                  fontWeight: 700,
                  color: 'var(--on-surface-variant)',
                }}
              >
                {ARABIC_WEEKDAYS.map((w) => (
                  <span key={w}>{w}</span>
                ))}
              </div>

              {/* Days Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(7, 1fr)',
                  gap: 4,
                }}
              >
                {Array.from({ length: firstDay }).map((_, i) => (
                  <span key={`empty-${i}`} />
                ))}

                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1
                  const currentIso = toIsoString(viewYear, viewMonth, day)
                  const isSelected = currentIso === value
                  const isToday = currentIso === todayIso

                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => handleSelectDay(day)}
                      style={{
                        height: 29,
                        borderRadius: 8,
                        border: isToday && !isSelected ? '1.5px solid var(--primary)' : 'none',
                        background: isSelected
                          ? 'var(--primary)'
                          : isToday
                            ? 'var(--primary-container)'
                            : 'transparent',
                        color: isSelected
                          ? 'var(--on-primary)'
                          : isToday
                            ? 'var(--on-primary-container)'
                            : 'var(--on-surface)',
                        fontWeight: isSelected || isToday ? 700 : 500,
                        fontSize: 12.5,
                        cursor: 'pointer',
                        display: 'grid',
                        placeItems: 'center',
                        transition: 'background 0.15s',
                      }}
                    >
                      {day}
                    </button>
                  )
                })}
              </div>
            </>
          )}

          {pickerMode === 'months' && (
            <div
              role="grid"
              aria-label="اختيار الشهر"
              style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}
            >
              {ARABIC_MONTHS.map((monthName, index) => {
                const isSelected = index === viewMonth
                const isCurrent = index === currentMonth && viewYear === currentYear
                return (
                  <button
                    key={monthName}
                    type="button"
                    onClick={() => handleSelectMonth(index)}
                    style={gridCellStyle(isSelected, isCurrent)}
                  >
                    {monthName}
                  </button>
                )
              })}
            </div>
          )}

          {pickerMode === 'years' && (
            <div
              role="grid"
              aria-label="اختيار السنة"
              style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}
            >
              {Array.from({ length: YEARS_PER_PAGE }).map((_, i) => {
                const year = yearsPageStart + i
                const isSelected = year === viewYear
                const isCurrent = year === currentYear
                return (
                  <button
                    key={year}
                    type="button"
                    onClick={() => handleSelectYear(year)}
                    style={gridCellStyle(isSelected, isCurrent)}
                  >
                    {year}
                  </button>
                )
              })}
            </div>
          )}

          {/* Footer Actions */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: 8,
              borderTop: '1px solid var(--outline-variant)',
            }}
          >
            <button
              type="button"
              className="btn text"
              onClick={handleClear}
              style={{ fontSize: 13, padding: '4px 8px' }}
            >
              مسح
            </button>
            <button
              type="button"
              className="btn text"
              onClick={closeDropdown}
              style={{ fontSize: 13, padding: '4px 8px' }}
            >
              إغلاق
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
