export const DEFAULT_ACCENT_HEX = '#65558F'

export function isValidHex(value: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(value)
}

function clamp255(n: number): number {
  return Math.max(0, Math.min(255, Math.round(n)))
}

// Replicates `color-mix(in srgb, seed P%, white|black)` in JS — plain
// linear interpolation in gamma (sRGB) space, same as the CSS function.
// Needed once: to know what the *computed* dark-mode --primary actually
// looks like, so --on-primary's contrast decision is based on the real
// rendered color instead of the raw (unmixed) seed.
function mixHex(hex: string, percent: number, base: 'white' | 'black'): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const baseVal = base === 'white' ? 255 : 0
  const p = percent / 100
  const toHex = (channel: number) => clamp255(channel * p + baseVal * (1 - p)).toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

// Standard YIQ-ish perceived-brightness check — decides whether text on
// top of `hex` should be white or dark.
export function getContrastOn(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const brightness = (r * 299 + g * 587 + b * 114) / 1000
  return brightness >= 150 ? '#1D1B20' : '#FFFFFF'
}

// Percent of --accent-seed mixed into each token (the rest is white/black,
// per mode) — reverse-engineered from how far the app's own original
// violet tokens (--primary #65558F) sit from white/black, then applied as
// a general ratio to ANY seed color. Unlike an HSL-hue-only approach,
// color-mix() blends the seed's actual saturation and lightness too, so a
// muted pastel seed produces a muted result and a vivid seed a vivid one
// — the whole picked color matters, not just its hue.
function tone(mixPercent: number, base: 'white' | 'black'): string {
  return `color-mix(in srgb, var(--accent-seed) ${mixPercent}%, ${base})`
}

/**
 * Builds the full light+dark CSS block for a given seed color (any hex).
 * Deliberately covers backgrounds/surfaces/text/chips too, not just the
 * primary button color — an earlier version only touched a handful of
 * tokens (primary/nav-active/logo) and most of the page visibly never
 * changed. Semantic colors (error/success) and hue-agnostic overlays
 * (scrim/shadow/hover) are left out on purpose: an error state must stay
 * recognizably red no matter the accent.
 *
 * index.html's bootstrap script duplicates this same structure (including
 * the mixHex/getContrastOn math) in vanilla JS so the chosen color
 * applies before first paint too — keep both in sync.
 */
export function buildAccentCss(seedHex: string): string {
  const onPrimaryLight = getContrastOn(seedHex)
  const darkPrimary = mixHex(seedHex, 55, 'white')
  const onPrimaryDark = getContrastOn(darkPrimary)

  return `:root {
  --accent-seed: ${seedHex};
  --primary: var(--accent-seed);
  --on-primary: ${onPrimaryLight};
  --primary-container: ${tone(20, 'white')};
  --on-primary-container: ${tone(75, 'black')};
  --secondary-container: ${tone(13, 'white')};
  --on-secondary-container: ${tone(58, 'black')};
  --tertiary-container: ${tone(20, 'white')};
  --on-tertiary-container: ${tone(75, 'black')};
  --bg: ${tone(8, 'white')};
  --surface: ${tone(3, 'white')};
  --surface-container-low: ${tone(10, 'white')};
  --surface-container: ${tone(13, 'white')};
  --surface-container-high: ${tone(16, 'white')};
  --surface-container-highest: ${tone(19, 'white')};
  --on-surface: ${tone(9, 'black')};
  --on-surface-variant: ${tone(48, 'black')};
  --outline: ${tone(28, 'black')};
  --outline-variant: ${tone(18, 'white')};
  --logo: ${tone(78, 'black')};
  --nav-active: ${tone(70, 'black')};
}
:root.dark,
:where(.dark, .dark *) {
  --accent-seed: ${seedHex};
  --primary: ${tone(55, 'white')};
  --on-primary: ${onPrimaryDark};
  --primary-container: ${tone(38, 'black')};
  --on-primary-container: ${tone(20, 'white')};
  --secondary-container: ${tone(24, 'black')};
  --on-secondary-container: ${tone(16, 'white')};
  --tertiary-container: ${tone(38, 'black')};
  --on-tertiary-container: ${tone(20, 'white')};
  --bg: ${tone(24, 'black')};
  --surface: ${tone(18, 'black')};
  --surface-container-low: ${tone(21, 'black')};
  --surface-container: ${tone(24, 'black')};
  --surface-container-high: ${tone(27, 'black')};
  --surface-container-highest: ${tone(31, 'black')};
  --on-surface: ${tone(12, 'white')};
  --on-surface-variant: ${tone(28, 'white')};
  --outline: ${tone(24, 'white')};
  --outline-variant: ${tone(16, 'black')};
  --logo: ${tone(65, 'white')};
  --nav-active: ${tone(20, 'white')};
}`
}
