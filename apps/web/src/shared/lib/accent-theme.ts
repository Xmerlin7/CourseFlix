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

/* ---------- Dark mode ----------
   Dark does NOT use the mix-toward-black mirror of RATIOS above, because
   that mirror is broken in two ways that light mode structurally can't
   have:

   1. Mixing toward black is a plain multiply, so it leaves HSV
      saturation completely untouched — `mix(#FF0000, 15%, black)` is
      #260000, still 100% saturated. Every seed produced 76–100%
      saturated surfaces where the app's own hand-tuned dark ramp sits at
      22–32%, so the whole page came out drenched in the accent hue.
      Light mode is fine for the opposite reason: mixing toward *white*
      desaturates, so it always lands on a subtle near-white tint.
   2. It made each surface's lightness a fraction of the SEED's
      lightness, so the ramp collapsed for dark seeds. The default violet
      spanned 6.6 L* from --bg to --surface-container-highest (the
      hand-tuned ramp spans 17.5); a seed like #1A0033 spanned 0.4 — no
      visible layering between the page, cards and dialogs at all.

   So dark takes only the seed's hue and saturation, and lays them over a
   FIXED lightness ramp: each token targets a perceptual L* copied from
   the app's own hand-tuned dark token of the same name, with saturation
   damped/capped per role. That keeps the ramp and every text/background
   contrast pair identical no matter which color is picked (measured:
   worst pair 7.3:1 across the hue circle, vs a 4.5 target), while the
   hue and the *relative* vividness still follow the seed — a muted seed
   still reads muted, a vivid one vivid, matching light mode's intent. */

// [target L*, seed-saturation multiplier, saturation cap]. The L* values
// are measured off the defaults in index.css's :root.dark block, so the
// default violet seed reproduces that palette almost exactly.
const DARK_TONES = {
  bg: [3.9, 0.7, 20],
  surface: [8.1, 0.7, 20],
  surfaceContainerLow: [12.1, 0.65, 18],
  surfaceContainer: [14.4, 0.65, 18],
  surfaceContainerHigh: [17.7, 0.6, 16],
  surfaceContainerHighest: [21.5, 0.55, 16],
  onSurface: [90, 0.8, 30],
  onSurfaceVariant: [80, 0.7, 25],
  outline: [60, 0.35, 14],
  outlineVariant: [30, 0.35, 14],
  primary: [80, 1.35, 95],
  primaryContainer: [30, 1.5, 65],
  secondaryContainer: [30, 0.6, 40],
  tertiaryContainer: [30, 0.7, 45],
  logo: [85, 1.6, 90],
} as const

// The two candidate tones for text/icons sitting ON a container, and the
// tone used for --nav-active / --on-*-container highlights.
const DARK_ON_LIGHT_L = 92
const DARK_ON_DARK_L = 12

function hexToHsl(hex: string): { h: number; s: number } {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const delta = max - min
  const l = (max + min) / 2
  if (delta === 0) return { h: 0, s: 0 }

  const s = delta / (1 - Math.abs(2 * l - 1))
  let h: number
  if (max === r) h = 60 * (((g - b) / delta) % 6)
  else if (max === g) h = 60 * ((b - r) / delta + 2)
  else h = 60 * ((r - g) / delta + 4)
  return { h: h < 0 ? h + 360 : h, s: s * 100 }
}

function hslToHex(h: number, s: number, l: number): string {
  const sN = s / 100
  const lN = l / 100
  const c = (1 - Math.abs(2 * lN - 1)) * sN
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = lN - c / 2
  const [r, g, b] =
    h >= 300 ? [c, 0, x]
    : h >= 240 ? [x, 0, c]
    : h >= 180 ? [0, x, c]
    : h >= 120 ? [0, c, x]
    : h >= 60 ? [x, c, 0]
    : [c, x, 0]
  const toHex = (channel: number) => clamp255((channel + m) * 255).toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

// WCAG relative luminance.
function luminance(hex: string): number {
  const channel = (v: number) => {
    const c = v / 255
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  }
  return (
    0.2126 * channel(parseInt(hex.slice(1, 3), 16)) +
    0.7152 * channel(parseInt(hex.slice(3, 5), 16)) +
    0.0722 * channel(parseInt(hex.slice(5, 7), 16))
  )
}

// CIE L* — perceived lightness, 0 (black) to 100 (white). Used instead
// of HSL's own `l` because HSL lightness is not perceptual: hsl(54, 65%,
// 38%) (yellow) and hsl(257, 65%, 38%) (violet) are the same `l` but
// nowhere near the same brightness, which is exactly what let luminous
// hues land mid-luminance where no same-hue text could reach 4.5:1.
function lstar(hex: string): number {
  const y = luminance(hex)
  return y <= 216 / 24389 ? (y * 24389) / 27 : Math.cbrt(y) * 116 - 16
}

function contrast(a: string, b: string): number {
  const la = luminance(a)
  const lb = luminance(b)
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)
}

// HSL lightness that puts (h, s) on a given perceptual L*. Binary search
// rather than a closed form: L* is monotonic in HSL lightness for fixed
// h/s, so ~18 halvings pin it to well under a rounding step.
function toneAt(h: number, s: number, targetL: number): string {
  let lo = 0
  let hi = 100
  for (let i = 0; i < 18; i++) {
    const mid = (lo + hi) / 2
    if (lstar(hslToHex(h, s, mid)) < targetL) lo = mid
    else hi = mid
  }
  return hslToHex(h, s, (lo + hi) / 2)
}

// Text/icon color for a container: the lighter or darker tone of the
// same hue, whichever actually reads better on it. Picking by measured
// contrast (rather than always going light, the way a dark theme
// normally would) is what keeps luminous accents — yellow, lime, cyan —
// legible instead of bottoming out around 3:1.
function darkOnColor(container: string, h: number, s: number): string {
  const light = toneAt(h, Math.min(s * 1.5, 90), DARK_ON_LIGHT_L)
  const dark = toneAt(h, Math.min(s * 1.5, 60), DARK_ON_DARK_L)
  return contrast(light, container) >= contrast(dark, container) ? light : dark
}

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

  const { h, s } = hexToHsl(seedHex)
  const tone = (name: keyof typeof DARK_TONES) => {
    const [targetL, mul, cap] = DARK_TONES[name]
    return toneAt(h, Math.min(s * mul, cap), targetL)
  }

  const primary = tone('primary')
  const primaryContainer = tone('primaryContainer')
  const secondaryContainer = tone('secondaryContainer')
  const tertiaryContainer = tone('tertiaryContainer')
  const highlight = toneAt(h, Math.min(s * 1.5, 90), DARK_ON_LIGHT_L)

  return {
    'accent-seed': seedHex,
    primary,
    'on-primary': darkOnColor(primary, h, s),
    'primary-container': primaryContainer,
    'on-primary-container': darkOnColor(primaryContainer, h, s),
    'secondary-container': secondaryContainer,
    'on-secondary-container': darkOnColor(secondaryContainer, h, s),
    'tertiary-container': tertiaryContainer,
    'on-tertiary-container': darkOnColor(tertiaryContainer, h, s),
    bg: tone('bg'),
    surface: tone('surface'),
    'surface-container-low': tone('surfaceContainerLow'),
    'surface-container': tone('surfaceContainer'),
    'surface-container-high': tone('surfaceContainerHigh'),
    'surface-container-highest': tone('surfaceContainerHighest'),
    'on-surface': tone('onSurface'),
    'on-surface-variant': tone('onSurfaceVariant'),
    outline: tone('outline'),
    'outline-variant': tone('outlineVariant'),
    logo: tone('logo'),
    'nav-active': highlight,
  }
}
