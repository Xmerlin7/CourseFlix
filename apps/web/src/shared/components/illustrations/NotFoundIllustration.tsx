import React from 'react'

export function NotFoundIllustration({ className = 'w-full max-w-sm sm:max-w-md h-auto' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 500 360"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="رسوم توضيحية لصفحة غير موجودة - طالب يبحث عن الدرس"
    >
      <defs>
        {/* Soft Drop Shadow Filter */}
        <filter id="softShadow" x="-15%" y="-15%" width="130%" height="130%">
          <feDropShadow dx="0" dy="6" stdDeviation="10" floodColor="#1E3A8A" floodOpacity="0.12" />
        </filter>
      </defs>

      {/* Background Soft Organic Blob Shape (Adapts smoothly in Dark Mode) */}
      <path
        d="M380 170C410 220 400 285 350 315C300 345 210 355 145 325C80 295 50 235 60 180C70 125 125 65 195 55C265 45 350 120 380 170Z"
        className="fill-blue-100/70 dark:fill-blue-900/40 transition-colors duration-300"
      />
      <path
        d="M175 45C205 28 250 32 275 50C300 68 295 100 272 110C249 120 195 115 170 98C145 80 145 62 175 45Z"
        className="fill-blue-200/50 dark:fill-blue-800/30 transition-colors duration-300"
      />

      {/* Classroom Window in Background */}
      <rect
        x="190"
        y="55"
        width="115"
        height="95"
        rx="8"
        className="stroke-blue-300/60 dark:stroke-blue-700/50 fill-white/40 dark:fill-slate-900/40"
        strokeWidth="2.5"
      />
      <line x1="247" y1="55" x2="247" y2="150" className="stroke-blue-300/60 dark:stroke-blue-700/50" strokeWidth="2" />
      <line x1="190" y1="102" x2="305" y2="102" className="stroke-blue-300/60 dark:stroke-blue-700/50" strokeWidth="2" />

      {/* Wall Shelf with Books & Analytics Chart */}
      <line x1="325" y1="100" x2="425" y2="100" className="stroke-blue-400 dark:stroke-blue-600" strokeWidth="3.5" strokeLinecap="round" />
      {/* Analytics Bars on shelf */}
      <rect x="340" y="78" width="10" height="22" rx="2" className="fill-blue-500 dark:fill-blue-400" />
      <rect x="354" y="68" width="10" height="32" rx="2" className="fill-blue-600 dark:fill-blue-500" />
      <rect x="368" y="74" width="10" height="26" rx="2" className="fill-indigo-600 dark:fill-indigo-400" />

      {/* Wall Clock */}
      <circle cx="135" cy="85" r="20" className="fill-white dark:fill-slate-800 stroke-blue-400 dark:stroke-blue-500" strokeWidth="2.5" />
      <path d="M135 74V85H142" className="stroke-blue-600 dark:stroke-blue-400" strokeWidth="2" strokeLinecap="round" />

      {/* Floor Line */}
      <line x1="60" y1="320" x2="440" y2="320" className="stroke-blue-200 dark:stroke-blue-900/80" strokeWidth="3.5" strokeLinecap="round" />

      {/* Potted Plant on Floor */}
      <path d="M85 320 L95 270 L125 270 L135 320 Z" className="fill-blue-800 dark:fill-blue-900" />
      <path d="M110 270 Q75 235 65 198 Q105 215 110 270 Z" className="fill-blue-500 dark:fill-blue-400" />
      <path d="M110 270 Q95 215 110 168 Q130 205 110 270 Z" className="fill-blue-600 dark:fill-blue-500" />
      <path d="M110 270 Q145 235 158 202 Q125 225 110 270 Z" className="fill-blue-400 dark:fill-blue-600" />

      {/* Study Desk */}
      <rect x="175" y="258" width="195" height="13" rx="4" className="fill-blue-700 dark:fill-blue-600" />
      <rect x="195" y="271" width="11" height="49" className="fill-blue-900 dark:fill-blue-950" />
      <rect x="340" y="271" width="11" height="49" className="fill-blue-900 dark:fill-blue-950" />

      {/* Desk Lamp */}
      <path d="M342 258 Q360 220 348 188 L334 195" className="stroke-blue-500 dark:stroke-blue-400" strokeWidth="3" fill="none" />
      <path d="M325 202 L343 188 L353 207 Z" className="fill-blue-600 dark:fill-blue-500" />
      <path d="M325 202 L275 258 L345 258 Z" className="fill-yellow-300/20 dark:fill-yellow-400/10" />

      {/* Stack of Books on Desk */}
      <rect x="195" y="244" width="52" height="14" rx="3" className="fill-blue-500 dark:fill-blue-600" />
      <rect x="200" y="232" width="45" height="12" rx="3" className="fill-blue-400 dark:fill-blue-500" />

      {/* CLEAN, SIMPLE FLAT GEOMETRIC CHARACTER (MINIMALIST SILHOUETTE STYLE) */}
      <g filter="url(#softShadow)">
        {/* Student Body / Torso Leaning Forward */}
        <path
          d="M255 258 C245 210 270 178 300 178 C330 178 340 210 335 258 Z"
          className="fill-blue-600 dark:fill-blue-500"
        />

        {/* Head - Simple Plain Circle Silhouette */}
        <circle cx="282" cy="156" r="21" className="fill-blue-600 dark:fill-blue-500" />

        {/* Arm Resting Leaning toward Desk */}
        <path
          d="M300 202 Q275 226 248 240"
          className="stroke-blue-200 dark:stroke-blue-300"
          strokeWidth="9"
          strokeLinecap="round"
          fill="none"
        />
      </g>

      {/* Open Laptop / Notebook on Desk with 404 Screen */}
      <rect x="223" y="226" width="82" height="32" rx="5" className="fill-white dark:fill-slate-800 stroke-blue-500 dark:stroke-blue-400" strokeWidth="2.2" />
      <text x="264" y="248" fontSize="16" fontWeight="900" fill="#2563EB" textAnchor="middle" className="font-mono dark:fill-blue-400">
        404
      </text>

      {/* Floating Confused Question Marks & Magnifying Glass */}
      {/* Primary Question Mark Bubble */}
      <g>
        <circle cx="265" cy="98" r="20" className="fill-blue-600 dark:fill-blue-500 shadow-lg" />
        <text x="265" y="106" fontSize="24" fontWeight="900" fill="#FFFFFF" textAnchor="middle">
          ؟
        </text>
      </g>

      {/* Secondary Question Mark Bubble */}
      <circle cx="308" cy="116" r="12" className="fill-blue-400/80 dark:fill-blue-600/80" />
      <text x="308" y="121" fontSize="14" fontWeight="800" fill="#FFFFFF" textAnchor="middle">
        ؟
      </text>

      {/* Floating Magnifying Glass */}
      <g transform="translate(140, 128) rotate(-15)">
        <circle cx="18" cy="18" r="14" className="stroke-blue-600 dark:stroke-blue-400 fill-blue-100/50 dark:fill-blue-900/50" strokeWidth="3.5" />
        <line x1="28" y1="28" x2="42" y2="42" className="stroke-blue-600 dark:stroke-blue-400" strokeWidth="4" strokeLinecap="round" />
        <path d="M11 14 Q16 9 21 14" className="stroke-blue-400 dark:stroke-blue-300" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      </g>
    </svg>
  )
}
