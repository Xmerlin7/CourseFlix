import { useId } from 'react'

type ForbiddenIllustrationProps = {
  className?: string
}

/**
 * Detailed flat-style illustration: security guard blocking a locked door.
 * Inspired by isometric 403-page illustrations (guard + door + caution tape).
 * Uses the project's purple accent with dark-mode-safe colors.
 */
export function ForbiddenIllustration({
  className = '',
}: ForbiddenIllustrationProps) {
  const rawId = useId()
  const uid = rawId.replace(/:/g, '')
  const stripeId = `${uid}-stripe`
  const clipId = `${uid}-clip`

  return (
    <svg
      viewBox="0 0 500 400"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <clipPath id={clipId}>
          <rect x="120" y="95" width="125" height="268" rx="4" />
        </clipPath>
        <pattern
          id={stripeId}
          width="10"
          height="10"
          patternTransform="rotate(45)"
          patternUnits="userSpaceOnUse"
        >
          <rect width="5" height="10" fill="#2d2d45" />
          <rect x="5" width="5" height="10" fill="#aa3bff" opacity="0.55" />
        </pattern>
      </defs>

      {/* ── Background decoration dashes ── */}
      <g opacity="0.12">
        <line x1="260" y1="108" x2="288" y2="108" stroke="#aa3bff" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="265" y1="117" x2="298" y2="117" stroke="#aa3bff" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="258" y1="126" x2="282" y2="126" stroke="#aa3bff" strokeWidth="2.5" strokeLinecap="round" />
      </g>

      {/* ── Ground shadow ── */}
      <ellipse
        cx="262"
        cy="366"
        rx="200"
        ry="26"
        className="fill-gray-200/80 dark:fill-gray-700/40"
      />

      {/* ── Large "403" text above door ── */}
      {/* 3D shadow offset */}
      <text
        x="103"
        y="90"
        fontFamily="'Arial Black', Impact, sans-serif"
        fontWeight="900"
        fontSize="52"
        className="fill-primary/15 dark:fill-primary/10"
      >
        403
      </text>
      {/* Main text */}
      <text
        x="100"
        y="87"
        fontFamily="'Arial Black', Impact, sans-serif"
        fontWeight="900"
        fontSize="52"
        className="fill-primary"
      >
        403
      </text>

      {/* ══════════════════ DOOR ══════════════════ */}
      {/* Frame */}
      <rect x="120" y="95" width="125" height="268" rx="4" fill="#2d2d45" />
      {/* Panel */}
      <rect
        x="127"
        y="102"
        width="111"
        height="254"
        rx="2"
        className="fill-purple-100 dark:fill-purple-950/50"
        stroke="#aa3bff"
        strokeWidth="0.6"
        strokeOpacity="0.25"
      />
      {/* Upper inset panel */}
      <rect
        x="138"
        y="120"
        width="89"
        height="62"
        rx="2.5"
        className="fill-purple-50 dark:fill-purple-900/30"
        stroke="#aa3bff"
        strokeWidth="0.7"
        strokeOpacity="0.2"
      />
      {/* Lower inset panel */}
      <rect
        x="138"
        y="200"
        width="89"
        height="58"
        rx="2.5"
        className="fill-purple-50 dark:fill-purple-900/30"
        stroke="#aa3bff"
        strokeWidth="0.7"
        strokeOpacity="0.2"
      />
      {/* Door handle */}
      <circle cx="225" cy="238" r="5.5" fill="#5a5a6c" />
      <circle cx="225" cy="238" r="2.2" fill="#aa3bff" opacity="0.55" />

      {/* ── ERROR sign hanging on door ── */}
      <circle cx="182" cy="108" r="1.5" fill="#5a5a6c" />
      <line x1="182" y1="109" x2="167" y2="127" stroke="#5a5a6c" strokeWidth="1" />
      <line x1="182" y1="109" x2="197" y2="127" stroke="#5a5a6c" strokeWidth="1" />
      <rect x="159" y="126" width="46" height="24" rx="2.5" fill="#2d2d45" />
      <text
        x="182"
        y="143"
        fontFamily="Arial, sans-serif"
        fontWeight="700"
        fontSize="10.5"
        fill="white"
        textAnchor="middle"
        letterSpacing="1"
      >
        ERROR
      </text>

      {/* ── Caution tape (clipped to door) ── */}
      <g clipPath={`url(#${clipId})`}>
        {/* Striped tape band */}
        <rect
          x="60"
          y="225"
          width="250"
          height="15"
          rx="1"
          fill={`url(#${stripeId})`}
          transform="rotate(-42, 182, 232)"
        />
        {/* Solid tape band with text */}
        <rect
          x="60"
          y="252"
          width="250"
          height="17"
          rx="1"
          fill="#aa3bff"
          opacity="0.6"
          transform="rotate(-42, 182, 260)"
        />
        <text
          transform="rotate(-42, 182, 262)"
          x="78"
          y="265"
          fontFamily="'Courier New', monospace"
          fontWeight="800"
          fontSize="6.5"
          fill="white"
          letterSpacing="2"
          opacity="0.9"
        >
          FORBIDDEN 403 FORBIDDEN 403
        </text>
      </g>

      {/* ══════════════════ PLANT ══════════════════ */}
      <g>
        {/* Pot rim */}
        <rect x="66" y="318" width="28" height="9" rx="3" fill="#3a3a52" />
        {/* Pot body */}
        <path d="M70 327 L64 362 L98 362 L92 327 Z" fill="#4a4a60" />

        {/* Leaf 1 — left */}
        <path d="M81 318 C77 292, 58 282, 48 266" stroke="#7a30c0" strokeWidth="2.2" fill="none" />
        <path d="M48 266 C40 260, 37 269, 46 274 C39 272, 35 280, 46 279" fill="#7a30c0" opacity="0.7" />
        {/* Leaf 2 — right */}
        <path d="M81 314 C85 288, 100 276, 107 262" stroke="#aa3bff" strokeWidth="2.2" fill="none" />
        <path d="M107 262 C115 256, 117 265, 109 270 C116 267, 120 275, 110 275" fill="#aa3bff" opacity="0.6" />
        {/* Leaf 3 — center-left small */}
        <path d="M81 316 C74 290, 56 280, 50 265" stroke="#c993ff" strokeWidth="1.6" fill="none" />
        <ellipse cx="48" cy="263" rx="7" ry="5" fill="#c993ff" opacity="0.5" transform="rotate(-25, 48, 263)" />
        {/* Leaf 4 — center-right small */}
        <path d="M81 310 C86 284, 97 274, 102 258" stroke="#aa3bff" strokeWidth="1.6" fill="none" />
        <ellipse cx="103" cy="256" rx="6.5" ry="4.5" fill="#aa3bff" opacity="0.4" transform="rotate(15, 103, 256)" />
      </g>

      {/* ══════════════════ GUARD CHARACTER ══════════════════ */}
      <g>
        {/* ── Shoes ── */}
        <ellipse cx="332" cy="360" rx="15" ry="6" fill="#1e1e35" />
        <ellipse cx="362" cy="360" rx="15" ry="6" fill="#1e1e35" />

        {/* ── Legs (pants) ── */}
        <rect x="323" y="292" width="21" height="66" rx="3.5" fill="#2d2d45" />
        <rect x="350" y="292" width="21" height="66" rx="3.5" fill="#2d2d45" />

        {/* ── Belt ── */}
        <rect x="308" y="284" width="76" height="10" rx="2" fill="#2d2d45" />
        <rect x="342" y="282" width="10" height="14" rx="2" fill="#d4a030" opacity="0.6" />

        {/* ── Torso (uniform shirt) ── */}
        <path d="M312 196 C312 193, 382 193, 382 196 L385 288 L309 288 Z" fill="#b87fff" />

        {/* Shirt center button line */}
        <line x1="347" y1="202" x2="347" y2="284" stroke="#9650dd" strokeWidth="1" opacity="0.3" />

        {/* Collar V */}
        <path d="M332 196 L347 214 L362 196" fill="none" stroke="white" strokeWidth="1.5" opacity="0.3" />

        {/* Epaulettes */}
        <rect x="309" y="194" width="17" height="5" rx="1.5" fill="#9650dd" opacity="0.4" />
        <rect x="368" y="194" width="17" height="5" rx="1.5" fill="#9650dd" opacity="0.4" />

        {/* Chest pocket */}
        <rect x="353" y="220" width="18" height="14" rx="2" fill="#9650dd" opacity="0.2" />

        {/* Chest badge (shield shape) */}
        <path d="M356 224 L362 220 L368 224 L368 230 L362 234 L356 230 Z" fill="white" opacity="0.4" />

        {/* ── Left arm (relaxed, hanging down) ── */}
        <path d="M314 202 Q304 240, 300 274" stroke="#b87fff" strokeWidth="15" strokeLinecap="round" fill="none" />
        <circle cx="299" cy="276" r="8" fill="#f0b090" />

        {/* ── Right arm (raised — stop gesture) ── */}
        <path d="M380 202 Q398 178, 407 152" stroke="#b87fff" strokeWidth="15" strokeLinecap="round" fill="none" />

        {/* Right hand — open palm with fingers */}
        <rect x="398" y="132" width="21" height="23" rx="6" fill="#f0b090" />
        {/* Fingers */}
        <rect x="399" y="118" width="4.5" height="16" rx="2.2" fill="#f0b090" />
        <rect x="404.5" y="115" width="4.5" height="19" rx="2.2" fill="#f0b090" />
        <rect x="410" y="115" width="4.5" height="19" rx="2.2" fill="#f0b090" />
        <rect x="415.5" y="118" width="4.5" height="16" rx="2.2" fill="#f0b090" />
        {/* Thumb */}
        <rect x="392" y="138" width="10" height="4.5" rx="2.2" fill="#f0b090" />

        {/* ── Neck ── */}
        <rect x="339" y="181" width="16" height="18" rx="4" fill="#f0b090" />

        {/* ── Head ── */}
        <ellipse cx="347" cy="168" rx="23" ry="25" fill="#f0b090" />

        {/* Ear */}
        <ellipse cx="370" cy="170" rx="4" ry="6.5" fill="#e8a070" />

        {/* ── Hair & Cap ── */}
        <path d="M324 160 Q324 140, 347 135 Q370 140, 370 160 Z" fill="#2d2d45" />
        <ellipse cx="347" cy="160" rx="28" ry="5.5" fill="#1e1e35" />
        {/* Cap badge */}
        <path d="M342 145 L347 142 L352 145 L352 151 L347 153 L342 151 Z" fill="white" opacity="0.5" />

        {/* ── Face details ── */}
        {/* Eyes */}
        <circle cx="339" cy="167" r="2.3" fill="#2d2d45" />
        <circle cx="355" cy="167" r="2.3" fill="#2d2d45" />
        {/* Eyebrows */}
        <path d="M335 162 Q339 160, 343 162" stroke="#2d2d45" strokeWidth="1.6" strokeLinecap="round" fill="none" />
        <path d="M351 162 Q355 160, 359 162" stroke="#2d2d45" strokeWidth="1.6" strokeLinecap="round" fill="none" />
        {/* Nose */}
        <path d="M347 170 C347 173, 345 174, 344 173" stroke="#d49570" strokeWidth="1.2" fill="none" strokeLinecap="round" />
        {/* Mouth */}
        <path d="M342 179 L352 179" stroke="#c4856e" strokeWidth="1.5" strokeLinecap="round" />
        {/* Cheek blush */}
        <circle cx="336" cy="175" r="3.5" fill="#e88888" opacity="0.22" />
        <circle cx="358" cy="175" r="3.5" fill="#e88888" opacity="0.22" />
      </g>

      {/* ── Speech bubble ("ممنوع") ── */}
      <path
        d="M305 96 L305 62 Q305 52, 315 52 L415 52 Q425 52, 425 62 L425 96 Q425 106, 415 106 L368 106 L358 122 L352 106 L315 106 Q305 106, 305 96 Z"
        fill="#aa3bff"
      />
      <text
        x="365"
        y="87"
        fontFamily="Arial, sans-serif"
        fontWeight="800"
        fontSize="18"
        fill="white"
        textAnchor="middle"
      >
        ممنوع
      </text>
    </svg>
  )
}
