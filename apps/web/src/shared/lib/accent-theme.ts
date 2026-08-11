export const DEFAULT_ACCENT_HEX = '#65558F'

export type AccentMode = 'light' | 'dark'

export function isValidHex(value: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(value)
}

function clamp255(n: number): number {
  return Math.max(0, Math.min(255, Math.round(n)))
}

// Plain linear interpolation in gamma (sRGB) space — replicates what
// `color-mix(in srgb, seed P%, white|black)` computes, but as a real
// hex string rather than a CSS function. Used directly (not just for
// contrast math) so the whole accent engine can apply as literal
// computed values via inline style/style.setProperty, instead of a
// <style> tag whose selectors have to out-cascade index.css's own
// default tokens — see buildAccentVars below for why that mattered.
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

// Percent of the seed mixed into each token (the rest is white/black,
// per mode) — reverse-engineered from how far the app's own original
// violet tokens (--primary #65558F) sit from white/black, then applied
// as a general ratio to ANY seed color. Blends the seed's actual
// saturation and lightness, not just its hue — a muted pastel seed
// produces a muted result, a vivid seed a vivid one.
const RATIOS = {
  primaryContainer: 20,
  onPrimaryContainer: 75,
  secondaryContainer: 20,
  onSecondaryContainer: 75,
  tertiaryContainer: 20,
  onTertiaryContainer: 75,
  bg: 8,
  surface: 3,
  surfaceContainerLow: 10,
  surfaceContainer: 13,
  surfaceContainerHigh: 16,
  surfaceContainerHighest: 19,
  onSurface: 9,
  onSurfaceVariant: 48,
  outline: 28,
  outlineVariant: 18,
  logo: 78,
  navActive: 70,
} as const

const DARK_RATIOS = {
  primaryContainer: 38,
  onPrimaryContainer: 20,
  secondaryContainer: 38,
  onSecondaryContainer: 20,
  tertiaryContainer: 38,
  onTertiaryContainer: 20,
  bg: 24,
  surface: 18,
  surfaceContainerLow: 21,
  surfaceContainer: 24,
  surfaceContainerHigh: 27,
  surfaceContainerHighest: 31,
  onSurface: 12,
  onSurfaceVariant: 28,
  outline: 24,
  outlineVariant: 16,
  logo: 65,
  navActive: 20,
} as const

// Every custom property this engine ever sets — used both to build the
// var map and to know exactly what to clean up when resetting to
// default (see clearAccentVars in useAccentColor.ts).
export const ACCENT_VAR_NAMES = [
  'accent-seed',
  'primary',
  'on-primary',
  'primary-container',
  'on-primary-container',
  'secondary-container',
  'on-secondary-container',
  'tertiary-container',
  'on-tertiary-container',
  'bg',
  'surface',
  'surface-container-low',
  'surface-container',
  'surface-container-high',
  'surface-container-highest',
  'on-surface',
  'on-surface-variant',
  'outline',
  'outline-variant',
  'logo',
  'nav-active',
] as const

/**
 * Computes the literal (hex) value for every token, for one mode, from
 * a seed color. Deliberately covers backgrounds/surfaces/text/chips
 * too, not just the primary button color — an earlier version only
 * touched a handful of tokens and most of the page visibly never
 * changed. Semantic colors (error/success) and hue-agnostic overlays
 * (scrim/shadow/hover) are left out on purpose: an error state must
 * stay recognizably red no matter the accent.
 *
 * Returns literal values (not `color-mix()` CSS text) so callers can
 * apply them via `style.setProperty(...)` directly on the root element.
 * That's the whole point: a <style> tag's selectors (`:root`/
 * `:root.dark`) have to out-cascade index.css's own default `:root`/
 * `:root.dark` blocks, which turned into a genuinely fragile fight over
 * specificity/!important/layer ordering across several rounds. An
 * inline style has no selector to lose a specificity contest with — it
 * always wins over any stylesheet rule in the same origin, full stop.
 *
 * index.html's bootstrap script duplicates this same math in vanilla JS
 * so the chosen color applies before first paint too — keep both in
 * sync.
 */
export function buildAccentVars(seedHex: string, mode: AccentMode): Record<string, string> {
  if (mode === 'light') {
    const onPrimary = getContrastOn(seedHex)
    return {
      'accent-seed': seedHex,
      primary: seedHex,
      'on-primary': onPrimary,
      'primary-container': mixHex(seedHex, RATIOS.primaryContainer, 'white'),
      'on-primary-container': mixHex(seedHex, RATIOS.onPrimaryContainer, 'black'),
      'secondary-container': mixHex(seedHex, RATIOS.secondaryContainer, 'white'),
      'on-secondary-container': mixHex(seedHex, RATIOS.onSecondaryContainer, 'black'),
      'tertiary-container': mixHex(seedHex, RATIOS.tertiaryContainer, 'white'),
      'on-tertiary-container': mixHex(seedHex, RATIOS.onTertiaryContainer, 'black'),
      bg: mixHex(seedHex, RATIOS.bg, 'white'),
      surface: mixHex(seedHex, RATIOS.surface, 'white'),
      'surface-container-low': mixHex(seedHex, RATIOS.surfaceContainerLow, 'white'),
      'surface-container': mixHex(seedHex, RATIOS.surfaceContainer, 'white'),
      'surface-container-high': mixHex(seedHex, RATIOS.surfaceContainerHigh, 'white'),
      'surface-container-highest': mixHex(seedHex, RATIOS.surfaceContainerHighest, 'white'),
      'on-surface': mixHex(seedHex, RATIOS.onSurface, 'black'),
      'on-surface-variant': mixHex(seedHex, RATIOS.onSurfaceVariant, 'black'),
      outline: mixHex(seedHex, RATIOS.outline, 'black'),
      'outline-variant': mixHex(seedHex, RATIOS.outlineVariant, 'white'),
      logo: mixHex(seedHex, RATIOS.logo, 'black'),
      'nav-active': mixHex(seedHex, RATIOS.navActive, 'black'),
    }
  }

  const darkPrimary = mixHex(seedHex, 55, 'white')
  const onPrimaryDark = getContrastOn(darkPrimary)
  return {
    'accent-seed': seedHex,
    primary: darkPrimary,
    'on-primary': onPrimaryDark,
    'primary-container': mixHex(seedHex, DARK_RATIOS.primaryContainer, 'black'),
    'on-primary-container': mixHex(seedHex, DARK_RATIOS.onPrimaryContainer, 'white'),
    'secondary-container': mixHex(seedHex, DARK_RATIOS.secondaryContainer, 'black'),
    'on-secondary-container': mixHex(seedHex, DARK_RATIOS.onSecondaryContainer, 'white'),
    'tertiary-container': mixHex(seedHex, DARK_RATIOS.tertiaryContainer, 'black'),
    'on-tertiary-container': mixHex(seedHex, DARK_RATIOS.onTertiaryContainer, 'white'),
    bg: mixHex(seedHex, DARK_RATIOS.bg, 'black'),
    surface: mixHex(seedHex, DARK_RATIOS.surface, 'black'),
    'surface-container-low': mixHex(seedHex, DARK_RATIOS.surfaceContainerLow, 'black'),
    'surface-container': mixHex(seedHex, DARK_RATIOS.surfaceContainer, 'black'),
    'surface-container-high': mixHex(seedHex, DARK_RATIOS.surfaceContainerHigh, 'black'),
    'surface-container-highest': mixHex(seedHex, DARK_RATIOS.surfaceContainerHighest, 'black'),
    'on-surface': mixHex(seedHex, DARK_RATIOS.onSurface, 'white'),
    'on-surface-variant': mixHex(seedHex, DARK_RATIOS.onSurfaceVariant, 'white'),
    outline: mixHex(seedHex, DARK_RATIOS.outline, 'white'),
    'outline-variant': mixHex(seedHex, DARK_RATIOS.outlineVariant, 'black'),
    logo: mixHex(seedHex, DARK_RATIOS.logo, 'white'),
    'nav-active': mixHex(seedHex, DARK_RATIOS.navActive, 'white'),
  }
}
