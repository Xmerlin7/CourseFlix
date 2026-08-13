interface SearchFieldProps {
  id: string
  value: string
  onChange: (value: string) => void
  /** Visible label above the box — every field in the app has one. */
  label: string
  placeholder: string
  /** Optional "N من M" style hint rendered under the box. */
  hint?: string
}

/**
 * The one search box used by every paginated list, so the leading icon,
 * the clear button and the width are identical everywhere. Pages used to
 * hand-roll a `.tf` with an input inside and each picked its own width.
 */
export function SearchField({
  id,
  value,
  onChange,
  label,
  placeholder,
  hint,
}: SearchFieldProps) {
  return (
    <div className="tf search-field section">
      <label htmlFor={id}>{label}</label>
      <div className="search-field-box">
        <span className="ms search-field-icon" aria-hidden="true">
          search
        </span>
        <input
          id={id}
          type="search"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          autoComplete="off"
        />
        {value && (
          <button
            type="button"
            className="search-field-clear"
            onClick={() => onChange('')}
            aria-label="مسح البحث"
          >
            <span className="ms">close</span>
          </button>
        )}
      </div>
      {hint && <span className="hint">{hint}</span>}
    </div>
  )
}
