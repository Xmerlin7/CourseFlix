/**
 * Material 3 shape-library artwork, used as a course's cover when it has
 * no uploaded image.
 *
 * Replaces the previous gradient-plus-dot-grid card, which looked the
 * same for every course — a wall of identical tiles gave the eye nothing
 * to latch onto in the browse grid.
 *
 * Three shapes, drawn from M3's shape set, clustered toward the leading
 * edge and left of centre: a soft triangle, a scalloped cookie, and a
 * rounded square. The trio and its arrangement stay fixed so the covers
 * read as one family; only *which* three shapes appear, and their exact
 * sizes, vary per course, picked deterministically from the title so the
 * same course always renders the same cover across pages and reloads.
 *
 * Colours come from the theme's surface/container tokens rather than the
 * `--illus-*` ramp: the ramp is mixed toward literal white/black and is
 * not redefined for dark mode, so a ramp-based cover stayed light-on-
 * light in dark theme. These follow the accent and both modes.
 */

/** One M3 shape, drawn to fill a 0 0 100 100 box. */
type ShapeName = 'triangle' | 'cookie' | 'squircle' | 'circle' | 'pill' | 'clover'

interface Slot {
  /** Centre, as a percent of the tile. */
  x: number
  y: number
  /** Width/height as a percent of the tile's shortest side. */
  size: number
  /** Muted, low-contrast tone — the cover is a backdrop for the card's
   *  title and progress bar, not competition for them. */
  fill: string
}

/**
 * The fixed arrangement every cover uses: one shape up and to the leading
 * side, two below it. Randomising placement as well as shape kept
 * producing tiles with everything bunched in a corner, so only *which*
 * shapes land in these slots varies — the composition does not.
 */
const SLOTS: Slot[] = [
  { x: 33, y: 30, size: 30, fill: 'var(--surface-container-highest)' },
  { x: 20, y: 63, size: 27, fill: 'var(--secondary-container)' },
  { x: 50, y: 66, size: 30, fill: 'var(--surface-container-highest)' },
]

const SHAPE_POOL: ShapeName[] = [
  'triangle',
  'cookie',
  'squircle',
  'circle',
  'pill',
  'clover',
]

/**
 * FNV-1a over the title's UTF-16 code units. Any stable non-cryptographic
 * hash would do; this one is short, needs no dependency, and spreads
 * Arabic titles across the pool (a naive length or char-sum hash did not
 * — Arabic course titles here cluster tightly in both).
 */
function hash(seed: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return Math.abs(h)
}

/** Three distinct shapes from the pool, chosen by the seed. */
function pickShapes(seed: string): ShapeName[] {
  const h = hash(seed)
  const pool = [...SHAPE_POOL]
  const picked: ShapeName[] = []
  for (let slot = 0; slot < SLOTS.length; slot += 1) {
    // A fresh digit of the hash per slot, over a shrinking pool, so the
    // three are always different from each other.
    const index = Math.floor(h / 7 ** slot) % pool.length
    picked.push(pool.splice(index, 1)[0])
  }
  return picked
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

    case 'triangle':
      // Rounded-corner triangle: the corners are arcs, not mitres, so it
      // belongs to the same soft family as the squircle and the cookie.
      return (
        <path
          d="M50 6 Q60 6 64 14 L93 68 Q98 78 90 85 Q84 90 76 90 L24 90 Q14 90 10 82 Q7 75 11 68 L40 14 Q44 6 50 6 Z"
          fill={fill}
        />
      )

    case 'cookie':
      // Twelve-lobed scalloped disc — M3's "cookie" shape. Built by
      // walking the circle and alternating the radius, which is far
      // shorter than hand-writing twenty-four bezier segments.
      return <path d={scallopPath(12)} fill={fill} />

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
  }
}

/**
 * A closed path alternating between an outer and inner radius, with each
 * outward bump drawn as an arc — the scalloped edge of M3's cookie shape.
 */
function scallopPath(lobes: number): string {
  const cx = 50
  const cy = 50
  const outer = 50
  const inner = 39
  const step = (Math.PI * 2) / lobes
  const at = (radius: number, angle: number) =>
    `${(cx + radius * Math.cos(angle)).toFixed(2)} ${(cy + radius * Math.sin(angle)).toFixed(2)}`

  // Arc radius that makes the bump meet both neighbouring inner points
  // tangentially. Half the chord between them is close enough at this size.
  const bump = ((outer - inner) / 2 + outer * Math.sin(step / 2)) / 2

  let d = `M${at(inner, -step / 2)}`
  for (let i = 0; i < lobes; i += 1) {
    const start = -step / 2 + i * step
    d += ` A${bump.toFixed(2)} ${bump.toFixed(2)} 0 0 1 ${at(inner, start + step)}`
  }
  return `${d} Z`
}

interface CourseThumbPlaceholderProps {
  /** Course title — the seed for which shapes are drawn. */
  seed: string
}

export function CourseThumbPlaceholder({ seed }: CourseThumbPlaceholderProps) {
  const shapes = pickShapes(seed)

  return (
    <svg
      className="thumb-shapes"
      viewBox="0 0 100 100"
      // The tile is wider than it is tall in most cards; slicing keeps
      // the shapes circular instead of stretching them into ovals.
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
    >
      <rect width="100" height="100" fill="var(--surface-container)" />
      {SLOTS.map((slot, index) => (
        <g
          key={index}
          transform={
            `translate(${slot.x - slot.size / 2} ${slot.y - slot.size / 2})` +
            ` scale(${slot.size / 100})`
          }
        >
          <Shape shape={shapes[index]} fill={slot.fill} />
        </g>
      ))}
    </svg>
  )
}
