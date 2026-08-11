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

// `!important` on every declaration — not just a specificity trick.
// index.css's own default :root/:root.dark blocks are unlayered author
// CSS too (same "layer" as this injected stylesheet), so a plain
// specificity/DOM-order tie (whichever <style> tag happened to land
// later in <head>) was enough to make the accent silently lose after a
// refresh, and made light-mode values leak into dark mode (or vice
// versa) depending on load timing. !important declarations sort into
// their own higher-priority bucket ahead of every non-important rule,
// regardless of specificity or source order — nothing else in this app
// declares these custom properties with !important, so nothing can win
// the tie back.
function decl(name: string, value: string): string {
  return `--${name}: ${value} !important;`
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
  ${decl('accent-seed', seedHex)}
  ${decl('primary', 'var(--accent-seed)')}
  ${decl('on-primary', onPrimaryLight)}
  ${decl('primary-container', tone(20, 'white'))}
  ${decl('on-primary-container', tone(75, 'black'))}
  ${decl('secondary-container', tone(20, 'white'))}
  ${decl('on-secondary-container', tone(75, 'black'))}
  ${decl('tertiary-container', tone(20, 'white'))}
  ${decl('on-tertiary-container', tone(75, 'black'))}
  ${decl('bg', tone(8, 'white'))}
  ${decl('surface', tone(3, 'white'))}
  ${decl('surface-container-low', tone(10, 'white'))}
  ${decl('surface-container', tone(13, 'white'))}
  ${decl('surface-container-high', tone(16, 'white'))}
  ${decl('surface-container-highest', tone(19, 'white'))}
  ${decl('on-surface', tone(9, 'black'))}
  ${decl('on-surface-variant', tone(48, 'black'))}
  ${decl('outline', tone(28, 'black'))}
  ${decl('outline-variant', tone(18, 'white'))}
  ${decl('logo', tone(78, 'black'))}
  ${decl('nav-active', tone(70, 'black'))}
}
:root.dark {
  ${decl('accent-seed', seedHex)}
  ${decl('primary', tone(55, 'white'))}
  ${decl('on-primary', onPrimaryDark)}
  ${decl('primary-container', tone(38, 'black'))}
  ${decl('on-primary-container', tone(20, 'white'))}
  ${decl('secondary-container', tone(38, 'black'))}
  ${decl('on-secondary-container', tone(20, 'white'))}
  ${decl('tertiary-container', tone(38, 'black'))}
  ${decl('on-tertiary-container', tone(20, 'white'))}
  ${decl('bg', tone(24, 'black'))}
  ${decl('surface', tone(18, 'black'))}
  ${decl('surface-container-low', tone(21, 'black'))}
  ${decl('surface-container', tone(24, 'black'))}
  ${decl('surface-container-high', tone(27, 'black'))}
  ${decl('surface-container-highest', tone(31, 'black'))}
  ${decl('on-surface', tone(12, 'white'))}
  ${decl('on-surface-variant', tone(28, 'white'))}
  ${decl('outline', tone(24, 'white'))}
  ${decl('outline-variant', tone(16, 'black'))}
  ${decl('logo', tone(65, 'white'))}
  ${decl('nav-active', tone(20, 'white'))}
}`
}
