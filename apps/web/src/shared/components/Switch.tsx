interface SwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  label: string
}

// Visually-hidden-but-functional checkbox styled as a track/thumb toggle
// (see `.switch` in index.css) — `label` is the accessible name, not
// rendered text, so callers place their own visible label next to it.
export function Switch({ checked, onChange, disabled, label }: SwitchProps) {
  return (
    <label className="switch">
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        aria-label={label}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span className="track" />
      <span className="thumb" />
    </label>
  )
}
