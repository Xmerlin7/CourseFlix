export function formatPercent(value: number | null) {
  if (value === null) {
    return ''
  }

  return `${value}%`
}
