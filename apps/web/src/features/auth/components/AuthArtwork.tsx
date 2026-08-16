/**
 * The showcase panel's artwork: a marbled fluid-paint field.
 *
 * Built as one inline SVG rather than an image file for two reasons. It has
 * to follow the accent colour the user picks in Settings and the light/dark
 * mode they are in — every fill below reads a CSS custom property, so the
 * whole piece re-tints for free. And a flat PNG large enough not to band on
 * a 2× display would cost more than this does.
 *
 * How the marbling works: the ribbons are plain elongated ellipses. The
 * `marble` filter runs fractal noise through a displacement map, which
 * pushes every pixel of those ellipses sideways by an amount driven by the
 * noise — straight edges become the organic, poured-paint veins the eye
 * reads as marble. `numOctaves` is kept at 3 and the viewBox small (the
 * filter works in user units, so a 420×640 canvas is far cheaper than a
 * viewport-sized one) because this is a one-off paint cost on a page whose
 * job is to render a login form quickly.
 *
 * Nothing here animates: the filter would have to re-run every frame, and
 * the piece is a still life. The slow sheen over it is plain CSS.
 */
export function AuthArtwork() {
  return (
    <svg
      className="cfa-art"
      viewBox="0 0 420 640"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <filter id="cfa-marble" x="-25%" y="-25%" width="150%" height="150%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.005 0.012"
            numOctaves="3"
            seed="11"
            result="noise"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="noise"
            scale="170"
            xChannelSelector="R"
            yChannelSelector="G"
          />
          <feGaussianBlur stdDeviation="5" />
        </filter>

        <filter id="cfa-bloom" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="34" />
        </filter>

        <linearGradient id="cfa-ground" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--cfa-art-deep)" />
          <stop offset="55%" stopColor="var(--cfa-art-base)" />
          <stop offset="100%" stopColor="var(--cfa-art-deep)" />
        </linearGradient>

        <radialGradient id="cfa-sheen" cx="0.72" cy="0.14" r="0.8">
          <stop offset="0%" stopColor="var(--cfa-art-light)" stopOpacity="0.55" />
          <stop offset="100%" stopColor="var(--cfa-art-light)" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width="420" height="640" fill="url(#cfa-ground)" />

      {/* Poured ribbons. Straight ellipses going in, marbled veins coming
          out — the displacement map does all of the shaping. */}
      <g filter="url(#cfa-marble)">
        <ellipse
          cx="330" cy="90" rx="200" ry="52"
          transform="rotate(-24 330 90)"
          fill="var(--cfa-art-cool)" opacity="0.92"
        />
        <ellipse
          cx="120" cy="190" rx="270" ry="74"
          transform="rotate(-36 120 190)"
          fill="var(--cfa-art-light)" opacity="0.85"
        />
        <ellipse
          cx="310" cy="315" rx="250" ry="62"
          transform="rotate(-29 310 315)"
          fill="var(--cfa-art-warm)" opacity="0.8"
        />
        <ellipse
          cx="150" cy="440" rx="290" ry="82"
          transform="rotate(-41 150 440)"
          fill="var(--cfa-art-cool)" opacity="0.88"
        />
        <ellipse
          cx="360" cy="540" rx="220" ry="58"
          transform="rotate(-26 360 540)"
          fill="var(--cfa-art-light)" opacity="0.7"
        />
        <ellipse
          cx="70" cy="600" rx="210" ry="56"
          transform="rotate(-34 70 600)"
          fill="var(--cfa-art-warm)" opacity="0.72"
        />
      </g>

      {/* Soft depth behind the veins, so the field never reads as flat. */}
      <g filter="url(#cfa-bloom)" opacity="0.5">
        <circle cx="340" cy="150" r="86" fill="var(--cfa-art-light)" />
        <circle cx="90" cy="470" r="104" fill="var(--cfa-art-cool)" />
      </g>

      <rect width="420" height="640" fill="url(#cfa-sheen)" />

      {/* The scattered cells of a real poured-paint pour. */}
      <g fill="var(--cfa-art-light)">
        <circle cx="292" cy="128" r="7" opacity="0.4" />
        <circle cx="318" cy="164" r="3.5" opacity="0.55" />
        <circle cx="136" cy="268" r="5" opacity="0.35" />
        <circle cx="168" cy="243" r="2.5" opacity="0.5" />
        <circle cx="248" cy="392" r="8" opacity="0.3" />
        <circle cx="278" cy="368" r="3" opacity="0.45" />
        <circle cx="94" cy="356" r="4" opacity="0.4" />
        <circle cx="352" cy="452" r="5.5" opacity="0.33" />
        <circle cx="196" cy="548" r="6.5" opacity="0.3" />
        <circle cx="222" cy="520" r="2.5" opacity="0.5" />
        <circle cx="62" cy="196" r="3.5" opacity="0.42" />
        <circle cx="384" cy="288" r="4.5" opacity="0.36" />
      </g>
    </svg>
  )
}
