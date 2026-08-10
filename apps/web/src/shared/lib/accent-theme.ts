export interface AccentPreset {
  name: string
  label: string
  hue: number
}

// 257 is the app's original violet hue — kept as a named preset ("resets"
// to the default palette, no injected stylesheet — see useAccentColor.ts).
export const DEFAULT_HUE = 257

export const ACCENT_PRESETS: AccentPreset[] = [
  { name: 'violet', label: 'بنفسجي', hue: DEFAULT_HUE },
  { name: 'blue', label: 'أزرق', hue: 215 },
  { name: 'teal', label: 'أخضر مائي', hue: 165 },
  { name: 'amber', label: 'كهرماني', hue: 38 },
  { name: 'rose', label: 'وردي', hue: 345 },
]

function tone(hue: number, saturation: number, lightness: number): string {
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`
}

/**
 * Builds the full light+dark CSS block for a given primary hue — any
 * hue, not just the five presets above (the picker also accepts a raw
 * <input type="color">). Every S/L pair here was reverse-engineered from
 * the app's own original violet tokens (hue ~257), so any hue reproduces
 * the same contrast behavior as the already-proven default instead of a
 * hand-picked, unverified combination.
 *
 * Deliberately covers backgrounds/surfaces/text too, not just the primary
 * button color — a prior version only touched a handful of tokens and
 * the accent visibly didn't apply to most of the page. Semantic colors
 * (error/success) and hue-agnostic overlays (scrim/shadow/hover) are left
 * out on purpose: an error state must stay recognizably red no matter the
 * accent.
 *
 * index.html's bootstrap script duplicates this same formula in vanilla
 * JS so the chosen hue applies before first paint — keep both in sync.
 */
export function buildAccentCss(hue: number): string {
  const tertiaryHue = (hue + 85) % 360

  return `:root {
  --primary: ${tone(hue, 25, 45)};
  --on-primary: #FFFFFF;
  --primary-container: ${tone(hue, 100, 93)};
  --on-primary-container: ${tone(hue, 43, 38)};
  --secondary-container: ${tone(hue, 65, 92)};
  --on-secondary-container: ${tone(hue, 13, 31)};
  --tertiary-container: ${tone(tertiaryHue, 100, 92)};
  --on-tertiary-container: ${tone(tertiaryHue, 25, 31)};
  --bg: ${tone(hue, 43, 93)};
  --surface: ${tone(hue, 100, 99)};
  --surface-container-low: ${tone(hue, 47, 96)};
  --surface-container: ${tone(hue, 40, 94)};
  --surface-container-high: ${tone(hue, 33, 92)};
  --surface-container-highest: ${tone(hue, 31, 89)};
  --on-surface: ${tone(hue, 8, 12)};
  --on-surface-variant: ${tone(hue, 13, 31)};
  --outline: ${tone(hue, 4, 48)};
  --outline-variant: ${tone(hue, 20, 83)};
  --logo: ${tone(hue, 52, 35)};
  --nav-active: ${tone(hue, 43, 38)};
}
:root.dark,
:where(.dark, .dark *) {
  --primary: ${tone(hue, 100, 87)};
  --on-primary: ${tone(hue, 42, 26)};
  --primary-container: ${tone(hue, 43, 38)};
  --on-primary-container: ${tone(hue, 100, 93)};
  --secondary-container: ${tone(hue, 13, 31)};
  --on-secondary-container: ${tone(hue, 65, 92)};
  --tertiary-container: ${tone(tertiaryHue, 25, 31)};
  --on-tertiary-container: ${tone(tertiaryHue, 100, 92)};
  --bg: ${tone(hue, 19, 6)};
  --surface: ${tone(hue, 19, 11)};
  --surface-container-low: ${tone(hue, 14, 14)};
  --surface-container: ${tone(hue, 18, 16)};
  --surface-container-high: ${tone(hue, 15, 19)};
  --surface-container-highest: ${tone(hue, 12, 22)};
  --on-surface: ${tone(hue, 29, 91)};
  --on-surface-variant: ${tone(hue, 19, 80)};
  --outline: ${tone(hue, 8, 59)};
  --outline-variant: ${tone(hue, 7, 29)};
  --logo: ${tone(hue, 100, 90)};
  --nav-active: ${tone(hue, 100, 93)};
}`
}

export function hexToHue(hex: string): number {
  const normalized = hex.replace('#', '')
  const r = parseInt(normalized.slice(0, 2), 16) / 255
  const g = parseInt(normalized.slice(2, 4), 16) / 255
  const b = parseInt(normalized.slice(4, 6), 16) / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const delta = max - min

  if (delta === 0) return 0

  let hue: number
  if (max === r) {
    hue = ((g - b) / delta) % 6
  } else if (max === g) {
    hue = (b - r) / delta + 2
  } else {
    hue = (r - g) / delta + 4
  }

  hue *= 60
  return Math.round(hue < 0 ? hue + 360 : hue)
}

// Inverse of the light-mode --primary tone (hue, 25%, 45%) as hex — used
// for swatch previews and as the native <input type="color">'s current
// value, which requires a hex string rather than an hsl() function.
export function hueToHex(hue: number): string {
  const s = 0.25
  const l = 0.45
  const k = (n: number) => (n + hue / 30) % 12
  const a = s * Math.min(l, 1 - l)
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))
  const toHex = (x: number) => Math.round(x * 255).toString(16).padStart(2, '0')
  return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`
}
