/**
 * The decorative half of the /login and /register split screen.
 *
 * Replaces the previous "four feature bullets on a gradient" panel with
 * something the audience actually recognises: the printed poster an
 * Egyptian private tutor puts up outside a study centre — subject in big
 * type, the teacher's name, the class timetable, a phone number and the
 * address.
 *
 * The portrait is deliberately featureless (no eyes, nose or mouth). It
 * stands for "the teacher" generically, and a drawn face would either
 * look like a specific real person or land in uncanny-valley territory at
 * this size. Everything is inline SVG + theme tokens, so the poster
 * follows the accent colour and light/dark mode like the rest of the app.
 *
 * The whole panel is decorative: every piece of information on it also
 * exists elsewhere in the product, and the DOM puts the form first, so
 * the caller marks it aria-hidden.
 */

const SCHEDULE = [
  { grade: 'الثالث الإعدادي', days: 'السبت والثلاثاء', time: '٤:٠٠ م' },
  { grade: 'الأول والثاني الثانوي', days: 'الأحد والأربعاء', time: '٦:٠٠ م' },
  { grade: 'الثالث الثانوي', days: 'الاثنين والخميس', time: '٨:٠٠ م' },
]

/**
 * Head-and-shoulders figure built from plain geometry.
 *
 * Skin and hair are literal colours rather than theme tokens on purpose —
 * the same reasoning as the `--illus-*` ramp's docblock: tinting skin with
 * whatever accent the user picked turns the figure green or pink. Only the
 * clothing follows the theme.
 */
function FacelessTeacher() {
  return (
    <svg
      className="poster-figure-svg"
      viewBox="0 0 160 160"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <clipPath id="poster-figure-clip">
          <circle cx="80" cy="80" r="80" />
        </clipPath>
      </defs>

      {/* Disc the figure is cropped into. */}
      <circle cx="80" cy="80" r="80" fill="var(--primary-container)" />
      {/* Painted back to front, so each layer tucks under the next: the
          neck disappears into the jacket, the jacket under the collar,
          the collar under the tie. Drawing the neck last (the obvious
          order, chin downward) left a skin-coloured block sitting on top
          of the shirt. */}
      <g clipPath="url(#poster-figure-clip)">
        {/* Neck. */}
        <rect x="70" y="84" width="20" height="26" rx="10" fill="#DDB089" />
        {/* Jacket / shoulders. */}
        <path
          d="M22 160 C22 122 47 104 80 104 C113 104 138 122 138 160 Z"
          fill="var(--primary)"
        />
        {/* Shirt showing at the collar. */}
        <path d="M64 106 L80 132 L96 106 L88 102 L80 112 L72 102 Z" fill="#F6F3FA" />
        {/* Tie. */}
        <path d="M80 130 L87 141 L80 160 L73 141 Z" fill="var(--tertiary-container)" />

        {/* Ears. */}
        <circle cx="52" cy="66" r="5.5" fill="#DDB089" />
        <circle cx="108" cy="66" r="5.5" fill="#DDB089" />
        {/* Head — no facial features, by design. */}
        <circle cx="80" cy="64" r="28" fill="#EFC7A0" />
        {/* Hair. */}
        <path
          d="M52 62 C52 42 64 32 80 32 C96 32 108 42 108 62 C103 53 94 48 80 48 C66 48 57 53 52 62 Z"
          fill="#3B2F2B"
        />
      </g>
    </svg>
  )
}

export function TeacherPoster() {
  return (
    <div className="poster">
      <div className="poster-head">
        <span className="poster-subject">الفيزياء</span>
        <span className="poster-head-note">مراجعات وحصص شرح</span>
      </div>

      <div className="poster-identity">
        <div className="poster-figure">
          <FacelessTeacher />
        </div>
        <div className="poster-titles">
          <p className="poster-eyebrow">مع الأستاذ</p>
          <p className="poster-name">محمد عبدالرحمن</p>
          <p className="poster-role">من الثالث الإعدادي إلى الثالث الثانوي</p>
        </div>
      </div>

      <ul className="poster-schedule">
        {SCHEDULE.map((row) => (
          <li key={row.grade} className="poster-schedule-row">
            <span className="poster-schedule-grade">{row.grade}</span>
            <span className="poster-schedule-days">{row.days}</span>
            <span className="poster-schedule-time">{row.time}</span>
          </li>
        ))}
      </ul>

      <div className="poster-contact">
        <span className="poster-contact-item">
          <span className="ms">call</span>
          <bdi>010 1234 5678</bdi>
        </span>
        <span className="poster-contact-item">
          <span className="ms">location_on</span>
          سنتر النخبة التعليمي — المنصورة
        </span>
      </div>
    </div>
  )
}
