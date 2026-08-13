/**
 * Material 3 shape-library artwork, used as a course's cover when it has
 * no uploaded image.
 *
 * Replaces the previous gradient-plus-dot-grid card, which looked the same
 * for every course — a wall of identical tiles gave the eye nothing to
 * latch onto in the browse grid. Each course now gets one of six
 * compositions built from M3's shape set (circle, squircle, clover,
 * pill, four-point burst, arch), picked deterministically from its title
 * so the same course always renders the same cover across pages, reloads
 * and roles.
 *
 * Colours come from the theme's container tokens rather than the
 * `--illus-*` ramp: the ramp is mixed toward literal white/black and is
 * not redefined for dark mode, so a ramp-based cover stayed light-on-light
 * in dark theme. The container tokens are defined per mode and follow the
 * accent the user picks in Settings.
 */

/** One M3 shape, drawn to fill a 0 0 100 100 box. */
type ShapeName = 'circle' | 'squircle' | 'clover' | 'pill' | 'burst' | 'arch'

interface Placed {
  shape: ShapeName
  /** Percent of the tile, from the inline-start/top edge. */
  x: number
  y: number
  /** Diameter as a percent of the tile's shortest side. */
  size: number
  fill: string
  rotate?: number
}

/**
 * Six fixed compositions. Hand-placed rather than randomised at render
 * time so a cover can't reflow between renders, and so each one can be
 * balanced by eye — random placement kept producing tiles with everything
 * bunched in one corner.
 */
const COMPOSITIONS: Placed[][] = [
  [
    { shape: 'squircle', x: 18, y: 20, size: 62, fill: 'var(--primary-container)' },
    { shape: 'circle', x: 66, y: 62, size: 44, fill: 'var(--tertiary-container)' },
    { shape: 'pill', x: 74, y: 20, size: 30, fill: 'var(--secondary-container)', rotate: 90 },
  ],
  [
    { shape: 'clover', x: 40, y: 46, size: 68, fill: 'var(--primary-container)' },
    { shape: 'circle', x: 82, y: 20, size: 26, fill: 'var(--secondary-container)' },
    { shape: 'circle', x: 16, y: 82, size: 20, fill: 'var(--tertiary-container)' },
  ],
  [
    { shape: 'arch', x: 36, y: 58, size: 66, fill: 'var(--secondary-container)' },
    { shape: 'circle', x: 74, y: 34, size: 40, fill: 'var(--primary-container)' },
    { shape: 'pill', x: 20, y: 18, size: 24, fill: 'var(--tertiary-container)' },
  ],
  [
    { shape: 'burst', x: 52, y: 46, size: 70, fill: 'var(--primary-container)' },
    { shape: 'squircle', x: 84, y: 84, size: 30, fill: 'var(--secondary-container)', rotate: 20 },
    { shape: 'circle', x: 14, y: 24, size: 22, fill: 'var(--tertiary-container)' },
  ],
  [
    { shape: 'circle', x: 30, y: 40, size: 56, fill: 'var(--tertiary-container)' },
    { shape: 'squircle', x: 70, y: 66, size: 48, fill: 'var(--primary-container)', rotate: 12 },
    { shape: 'pill', x: 76, y: 22, size: 26, fill: 'var(--secondary-container)', rotate: 35 },
  ],
  [
    { shape: 'pill', x: 34, y: 34, size: 58, fill: 'var(--primary-container)', rotate: 45 },
    { shape: 'clover', x: 74, y: 70, size: 44, fill: 'var(--secondary-container)' },
    { shape: 'circle', x: 22, y: 80, size: 24, fill: 'var(--tertiary-container)' },
  ],
]

/**
 * FNV-1a over the title's UTF-16 code units. Any stable non-cryptographic
 * hash would do; this one is short, needs no dependency, and spreads
 * Arabic titles across all six buckets (a naive length or char-sum hash
 * did not — Arabic course titles here cluster tightly in both).
 */
function pickComposition(seed: string): Placed[] {
  let hash = 0x811c9dc5
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return COMPOSITIONS[Math.abs(hash) % COMPOSITIONS.length]
}

function Shape({ shape, fill }: { shape: ShapeName; fill: string }) {
  switch (shape) {
    case 'circle':
      return <circle cx="50" cy="50" r="50" fill={fill} />
    case 'squircle':
      // rx ≈ 30% of the side is M3's "extra large" corner on a square.
      return <rect x="0" y="0" width="100" height="100" rx="30" fill={fill} />
    case 'pill':
      return <rect x="0" y="22" width="100" height="56" rx="28" fill={fill} />
    case 'clover':
      // Four lobes plus the square that joins them — M3's quatrefoil.
      return (
        <g fill={fill}>
          <rect x="14" y="14" width="72" height="72" rx="4" />
          <circle cx="32" cy="32" r="32" />
          <circle cx="68" cy="32" r="32" />
          <circle cx="32" cy="68" r="32" />
          <circle cx="68" cy="68" r="32" />
        </g>
      )
    case 'burst':
      // Four-point concave star: straight-line points would read as a
      // plain diamond, so the sides curve inward through the midpoints.
      return (
        <path
          d="M50 0 Q57 43 100 50 Q57 57 50 100 Q43 57 0 50 Q43 43 50 0 Z"
          fill={fill}
        />
      )
    case 'arch':
      return <path d="M0 100 L0 50 A50 50 0 0 1 100 50 L100 100 Z" fill={fill} />
  }
}

interface CourseThumbPlaceholderProps {
  /** Course title — the seed for which composition is drawn. */
  seed: string
}

export function CourseThumbPlaceholder({ seed }: CourseThumbPlaceholderProps) {
  const composition = pickComposition(seed)

  return (
    <svg
      className="thumb-shapes"
      viewBox="0 0 200 200"
      // The tile is wider than it is tall in most cards; slicing keeps the
      // shapes circular instead of stretching them into ovals.
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
    >
      <rect width="200" height="200" fill="var(--surface-container-high)" />
      {composition.map((placed, index) => {
        const side = placed.size * 2
        const originX = placed.x * 2 - side / 2
        const originY = placed.y * 2 - side / 2
        return (
          <g
            key={index}
            transform={
              `translate(${originX} ${originY}) scale(${side / 100})` +
              (placed.rotate ? ` rotate(${placed.rotate} 50 50)` : '')
            }
          >
            <Shape shape={placed.shape} fill={placed.fill} />
          </g>
        )
      })}
    </svg>
  )
}
