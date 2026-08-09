import { useEffect, useRef, useState } from 'react'

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

export function DatePicker({
  id,
  label,
  value,
  onChange,
  placeholder = 'اختر التاريخ...',
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
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

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false)
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

  const daysInMonth = getDaysInMonth(viewYear, viewMonth)
  const firstDay = getFirstDayOfWeek(viewYear, viewMonth)

  const todayIso = new Date().toISOString().split('T')[0]

  const handleSelectDay = (day: number) => {
    const selectedIso = toIsoString(viewYear, viewMonth, day)
    onChange(selectedIso)
    setIsOpen(false)
  }

  const handleClear = () => {
    onChange('')
    setIsOpen(false)
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
          onClick={() => setIsOpen((open) => !open)}
          aria-expanded={isOpen}
          aria-haspopup="dialog"
          style={{
            cursor: 'pointer',
            paddingInlineEnd: '42px',
          }}
        />
        <button
          type="button"
          onClick={() => setIsOpen((open) => !open)}
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
            top: 'calc(100% + 6px)',
            insetInlineStart: 0,
            zIndex: 100,
            width: 290,
            background: 'var(--surface-container-high)',
            border: '1px solid var(--outline-variant)',
            borderRadius: 20,
            padding: 16,
            boxShadow: 'var(--shadow-lg)',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
          dir="rtl"
        >
          {/* Calendar Header */}
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
              onClick={prevMonth}
              aria-label="الشهر السابق"
              style={{ width: 32, height: 32 }}
            >
              <span className="ms">chevron_right</span>
            </button>

            <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--on-surface)' }}>
              {ARABIC_MONTHS[viewMonth]} {viewYear}
            </span>

            <button
              type="button"
              className="icon-btn"
              onClick={nextMonth}
              aria-label="الشهر التالي"
              style={{ width: 32, height: 32 }}
            >
              <span className="ms">chevron_left</span>
            </button>
          </div>

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
                    height: 32,
                    borderRadius: 10,
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
                    fontSize: 13,
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
              onClick={() => setIsOpen(false)}
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
