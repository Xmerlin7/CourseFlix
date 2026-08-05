/**
 * ErrorIllustration — an inline SVG depicting a disconnected cloud/cable
 * with a gentle warning indicator. Uses `currentColor`-aware palette so
 * it adapts to light/dark mode via Tailwind classes on the parent.
 *
 * Transparent background — no hardcoded whites.
 */
export function ErrorIllustration({ className = '' }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 200 160"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      {/* Background decorative circles */}
      <circle cx="100" cy="80" r="70" className="fill-amber-50 dark:fill-amber-950/20" />
      <circle cx="100" cy="80" r="50" className="fill-amber-100/60 dark:fill-amber-900/15" />

      {/* Cloud body */}
      <path
        d="M60 90c-11 0-20-9-20-20s9-20 20-20c2-14 14-25 29-25 13 0 24 9 28 21 2-1 5-1 7-1 11 0 20 9 20 20s-9 20-20 20H60z"
        className="fill-white dark:fill-gray-800 stroke-amber-300 dark:stroke-amber-500/60"
        strokeWidth="2"
        strokeLinejoin="round"
      />

      {/* Cloud inner shading line */}
      <path
        d="M55 80c5-3 12-4 18-2 6 2 13 1 18-3 5-4 12-5 18-3"
        className="stroke-amber-200 dark:stroke-amber-700/40"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />

      {/* Lightning bolt */}
      <path
        d="M95 72l-6 14h8l-4 12 12-16h-8l5-10H95z"
        className="fill-amber-400 dark:fill-amber-500"
      />

      {/* Disconnected cable - left side */}
      <path
        d="M70 100c0 0 5 20 15 25"
        className="stroke-gray-300 dark:stroke-gray-600"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
      {/* Cable plug left */}
      <rect
        x="81" y="122" width="8" height="12" rx="2"
        className="fill-gray-300 dark:fill-gray-600"
      />
      <circle cx="85" cy="126" r="1.5" className="fill-gray-400 dark:fill-gray-500" />

      {/* Disconnected cable - right side */}
      <path
        d="M130 100c0 0-5 20-15 25"
        className="stroke-gray-300 dark:stroke-gray-600"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
      {/* Cable plug right */}
      <rect
        x="111" y="122" width="8" height="12" rx="2"
        className="fill-gray-300 dark:fill-gray-600"
      />
      <circle cx="115" cy="126" r="1.5" className="fill-gray-400 dark:fill-gray-500" />

      {/* Gap spark marks between plugs */}
      <line x1="93" y1="130" x2="97" y2="128" className="stroke-amber-400 dark:stroke-amber-500" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="100" y1="126" x2="100" y2="132" className="stroke-amber-400 dark:stroke-amber-500" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="103" y1="128" x2="107" y2="130" className="stroke-amber-400 dark:stroke-amber-500" strokeWidth="1.5" strokeLinecap="round" />

      {/* Warning badge circle */}
      <circle cx="145" cy="55" r="16" className="fill-amber-400 dark:fill-amber-500" />
      <circle cx="145" cy="55" r="14" className="fill-amber-50 dark:fill-amber-950" />
      {/* Exclamation mark inside badge */}
      <line x1="145" y1="47" x2="145" y2="57" className="stroke-amber-500 dark:stroke-amber-400" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="145" cy="62" r="1.5" className="fill-amber-500 dark:fill-amber-400" />

      {/* Decorative floating dots */}
      <circle cx="35" cy="55" r="2" className="fill-amber-200 dark:fill-amber-800/40" />
      <circle cx="170" cy="95" r="2.5" className="fill-amber-200 dark:fill-amber-800/40" />
      <circle cx="28" cy="100" r="1.5" className="fill-amber-300/50 dark:fill-amber-700/30" />
      <circle cx="175" cy="45" r="1.5" className="fill-amber-300/50 dark:fill-amber-700/30" />
    </svg>
  )
}
