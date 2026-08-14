import { BellOff } from 'lucide-react'

type EmptyStateVariant = 'default' | 'search' | 'notifications' | 'courses' | 'replies'

type EmptyStateProps = {
  title?: string
  message?: string
  actionLabel?: string
  onAction?: () => void
  variant?: EmptyStateVariant
  // Set when this is the page's only content (a list/table with zero
  // rows) — fills and centers within the full page instead of the
  // compact size used when it's one section among several (e.g. a
  // dashboard's "recent courses" panel below other content).
  fullPage?: boolean
  // Set when rendered inside inline sections (e.g. course announcements)
  // to avoid consuming excessive vertical space.
  compact?: boolean
}

const variantIllustrations: Record<string, string> = {
  default: '/illustrations/empty-default.png',
  search: '/illustrations/empty-search.png',
  courses: '/illustrations/empty-courses.png',
}

function WaitingReplyIllustration() {
  return (
    <svg
      width="180"
      height="180"
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="empty-state__replies-svg"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="bgGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#E8DEF8" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#F3EDF7" stopOpacity="0.3" />
        </radialGradient>
        <linearGradient id="primaryGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#65558F" />
          <stop offset="100%" stopColor="#4F378B" />
        </linearGradient>
        <filter id="dropShadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#65558F" floodOpacity="0.15" />
        </filter>
      </defs>

      {/* Subtle Background Glow */}
      <circle cx="100" cy="100" r="90" fill="url(#bgGlow)" />

      {/* Desk line */}
      <path d="M 30 152 H 170" stroke="#CAC4D0" strokeWidth="3" strokeLinecap="round" />

      {/* Laptop base */}
      <path d="M 72 152 L 78 144 H 122 L 128 152 Z" fill="#79747E" />
      {/* Laptop screen back */}
      <rect x="78" y="112" width="44" height="32" rx="4" fill="url(#primaryGrad)" />
      {/* Laptop screen display */}
      <rect x="81" y="115" width="38" height="26" rx="2" fill="#E8DEF8" />
      {/* Screen code lines mockup */}
      <line x1="86" y1="122" x2="104" y2="122" stroke="#65558F" strokeWidth="2" strokeLinecap="round" />
      <line x1="86" y1="128" x2="112" y2="128" stroke="#9A82DB" strokeWidth="2" strokeLinecap="round" />
      <line x1="86" y1="134" x2="98" y2="134" stroke="#65558F" strokeWidth="2" strokeLinecap="round" />

      {/* Student Character */}
      <path d="M 124 102 C 122 88 136 84 144 92 C 148 98 146 112 140 118 Z" fill="#31111D" />
      <path d="M 124 126 C 122 118 132 114 140 114 C 148 114 158 118 156 126 L 158 152 H 122 Z" fill="url(#primaryGrad)" />
      <path d="M 130 126 Q 116 138 108 146" stroke="url(#primaryGrad)" strokeWidth="8" strokeLinecap="round" />
      <circle cx="138" cy="100" r="14" fill="#FFD8BE" />
      <path d="M 126 98 C 130 86 146 86 150 96 C 142 92 132 94 126 98 Z" fill="#31111D" />
      {/* Both Eyes & Smile */}
      <circle cx="133" cy="100" r="1.8" fill="#31111D" />
      <circle cx="141" cy="100" r="1.8" fill="#31111D" />
      <path d="M 134 106 Q 137 108 140 106" stroke="#31111D" strokeWidth="1.2" strokeLinecap="round" fill="none" />
      <circle cx="108" cy="146" r="4" fill="#FFD8BE" />

      {/* Floating Chat Speech Bubble with Typing Dots */}
      <g filter="url(#dropShadow)">
        <path
          d="M 52 48 H 108 C 114.6 48 120 53.4 120 60 V 78 C 120 84.6 114.6 90 108 90 H 76 L 62 102 V 90 H 52 C 45.4 90 40 84.6 40 78 V 60 C 40 53.4 45.4 48 52 48 Z"
          fill="url(#primaryGrad)"
        />
        <circle cx="64" cy="69" r="4.5" fill="#E8DEF8">
          <animate attributeName="opacity" values="0.4;1;0.4" dur="1.4s" repeatCount="indefinite" begin="0s" />
        </circle>
        <circle cx="80" cy="69" r="4.5" fill="#E8DEF8">
          <animate attributeName="opacity" values="0.4;1;0.4" dur="1.4s" repeatCount="indefinite" begin="0.2s" />
        </circle>
        <circle cx="96" cy="69" r="4.5" fill="#E8DEF8">
          <animate attributeName="opacity" values="0.4;1;0.4" dur="1.4s" repeatCount="indefinite" begin="0.4s" />
        </circle>
      </g>

      {/* Waiting Clock Badge */}
      <g filter="url(#dropShadow)">
        <circle cx="138" cy="52" r="16" fill="#E8DEF8" stroke="#65558F" strokeWidth="2" />
        <circle cx="138" cy="52" r="2" fill="#65558F" />
        <path d="M 138 42 V 52 L 144 56" stroke="#65558F" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </g>

      {/* Floating Sparkles */}
      <path d="M 42 110 L 44 114 L 48 116 L 44 118 L 42 122 L 40 118 L 36 116 L 40 114 Z" fill="#9A82DB" opacity="0.8" />
      <path d="M 165 80 L 166.5 83 L 169.5 84.5 L 166.5 86 L 165 89 L 163.5 86 L 160.5 84.5 L 163.5 83 Z" fill="#65558F" opacity="0.7" />
    </svg>
  )
}

export function EmptyState({
  title = 'لا يوجد محتوى لعرضه',
  message = 'لم نجد أي بيانات هنا حتى الآن',
  actionLabel,
  onAction,
  variant = 'default',
  fullPage = false,
  compact = false,
}: EmptyStateProps) {
  const illustrationSrc = variantIllustrations[variant]
  const isNotifications = variant === 'notifications'
  const isReplies = variant === 'replies'

  return (
    <div
      className={`empty-state${fullPage ? ' empty-state--full-page' : ''}${compact ? ' empty-state--compact' : ''}`}
      role="status"
    >
      {/* Illustration or icon inside circular container */}
      <div className={`empty-state__blob${isNotifications ? ' empty-state__blob--icon' : ''}${isReplies ? ' empty-state__blob--replies' : ''}`}>
        {isNotifications ? (
          <div className="empty-state__icon-wrap">
            <BellOff
              size={isNotifications && compact ? 36 : 58}
              strokeWidth={1.5}
              aria-hidden="true"
              className="empty-state__icon"
            />
            {/* Decorative zzz sleep letters */}
            <span className="empty-state__zzz empty-state__zzz--1" aria-hidden="true">z</span>
            <span className="empty-state__zzz empty-state__zzz--2" aria-hidden="true">z</span>
            <span className="empty-state__zzz empty-state__zzz--3" aria-hidden="true">Z</span>
          </div>
        ) : isReplies ? (
          <WaitingReplyIllustration />
        ) : (
          <img
            src={illustrationSrc}
            alt=""
            aria-hidden="true"
            draggable={false}
            className="empty-state__img"
          />
        )}
      </div>

      {/* Text content */}
      <div className="empty-state__text">
        <h3 className="empty-state__title">{title}</h3>
        <p className="empty-state__message">{message}</p>
      </div>

      {/* Action button */}
      {actionLabel && onAction && (
        <button onClick={onAction} className="empty-state__btn">
          {actionLabel}
        </button>
      )}

      <style>{`
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 20px;
          padding: 48px 24px 56px;
          text-align: center;
        }

        .empty-state--compact {
          padding: 24px 16px 28px;
          gap: 12px;
        }

        .empty-state--compact .empty-state__blob {
          width: 100px;
          height: 100px;
        }

        .empty-state--compact .empty-state__title {
          font-size: 1.05rem;
        }

        .empty-state--compact .empty-state__message {
          font-size: 0.85rem;
        }

        /* Fill the page, not just the width its own content needs — same
           min-height/width ErrorState already uses, so a genuinely empty
           page reads as a real full-screen state instead of a small icon
           stuck wherever it fell in the flow. Only applied when this is
           the page's sole content (fullPage prop) — a dashboard's inline
           "no recent courses yet" panel stays compact. */
        .empty-state--full-page {
          min-height: 60vh;
          width: 100%;
        }

        /* Circular blob container behind the illustration */
        .empty-state__blob {
          width: 240px;
          height: 240px;
          border-radius: 50%;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--secondary-container);
          flex-shrink: 0;
        }

        /* Icon-only variant (notifications) — same container, amber theme */
        .empty-state__blob--icon {
          background: #fffbeb;
          overflow: visible;            /* allow zzz to overflow */
        }

        .empty-state__icon-wrap {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .empty-state__icon {
          color: #f59e0b;               /* amber-500 */
        }

        /* Decorative zzz sleep letters */
        .empty-state__zzz {
          position: absolute;
          font-weight: 700;
          font-style: italic;
          color: #fcd34d;               /* amber-300 */
          user-select: none;
          pointer-events: none;
          line-height: 1;
        }
        .empty-state__zzz--1 {
          font-size: 8px;
          top: -4px;
          right: -8px;
          opacity: 0.6;
        }
        .empty-state__zzz--2 {
          font-size: 11px;
          top: -14px;
          right: -18px;
          opacity: 0.8;
        }
        .empty-state__zzz--3 {
          font-size: 14px;
          top: -26px;
          right: -30px;
          opacity: 1;
          color: #f59e0b;               /* amber-500 — darkest Z */
        }

        .empty-state__img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          user-select: none;
          pointer-events: none;
          mix-blend-mode: multiply;     /* makes white areas transparent */
        }

        .empty-state__title {
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--on-surface);
          margin: 0;
          line-height: 1.4;
        }

        .empty-state__message {
          font-size: 0.9rem;
          color: var(--on-surface-variant);
          max-width: 320px;
          line-height: 1.7;
          margin: 0 auto;
        }

        .empty-state__text {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .empty-state__btn {
          margin-top: 4px;
          padding: 12px 32px;
          background-color: var(--primary);
          color: var(--on-primary);
          font-size: 0.95rem;
          font-weight: 600;
          border-radius: 10px;
          border: none;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: var(--shadow);
          letter-spacing: 0.01em;
        }
        .empty-state__btn:hover {
          filter: brightness(1.06);
          transform: translateY(-1px);
          box-shadow: var(--shadow);
        }
        .empty-state__btn:active {
          transform: scale(0.97);
        }

        /* ── Dark mode ─────────────────────────────────
           Keyed off the explicit .dark class, not
           prefers-color-scheme: the OS query would override a
           deliberate "light" choice on a dark-OS machine. */
        :where(.dark, .dark *) .empty-state__blob--icon {
          background: rgba(120, 53, 15, 0.3);
        }

        :where(.dark, .dark *) .empty-state__icon {
          color: #fbbf24;
        }

        :where(.dark, .dark *) .empty-state__zzz {
          color: rgba(251, 191, 36, 0.35);
        }
        :where(.dark, .dark *) .empty-state__zzz--3 {
          color: rgba(251, 191, 36, 0.6);
        }
      `}</style>
    </div>
  )
}

