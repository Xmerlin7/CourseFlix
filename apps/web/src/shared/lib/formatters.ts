export function formatPercent(value: number | null) {
  if (value === null) {
    return ''
  }

  return `${value}%`
}

// mm:ss, or hh:mm:ss once the video passes an hour — matches native
// <video> control conventions so the resume banner reads naturally next
// to the player's own timestamp.
export function formatDuration(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds))
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainingSeconds = seconds % 60

  const paddedMinutes = hours > 0 ? String(minutes).padStart(2, '0') : String(minutes)
  const paddedSeconds = String(remainingSeconds).padStart(2, '0')

  return hours > 0 ? `${hours}:${paddedMinutes}:${paddedSeconds}` : `${paddedMinutes}:${paddedSeconds}`
}
