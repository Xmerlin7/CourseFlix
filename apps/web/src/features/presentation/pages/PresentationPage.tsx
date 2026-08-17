import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { useTheme } from '../../../shared/hooks/useTheme'
import shotLogin from '../assets/shot-login.png'
import shotRegister from '../assets/shot-register.png'
import shotStudentDashboard from '../assets/shot-student-dashboard.png'
import shotCourseDetail from '../assets/shot-course-detail.png'
import shotNotifications from '../assets/shot-notifications.png'
import shotCommunity from '../assets/shot-community.png'
import shotSettings from '../assets/shot-settings.png'
import './PresentationPage.css'

// CourseFlix graduation-project presentation — a slide deck styled like
// the platform (light Material palette, purple/teal accents) with a
// keyboard/click-driven flow mirroring the HR System deck structure.
// Reach it at /present.

interface SlideMeta {
  kicker: string
  title: string
}

type SlideRenderer = (meta: SlideMeta) => JSX.Element

interface DeckEntry {
  meta: SlideMeta
  render: SlideRenderer
}

// ─── Shared visual atoms ───────────────────────────────────────────────
function SlideShell({ meta, children }: { meta: SlideMeta; children: React.ReactNode }) {
  return (
    <section className="pres-slide" aria-label={meta.title}>
      <header className="pres-slide-header">
        <span className="pres-kicker">{meta.kicker}</span>
        <h2 className="pres-title">{meta.title}</h2>
        <span className="pres-rule" aria-hidden="true" />
      </header>
      {children}
    </section>
  )
}

function Card({ title, body }: { title: string; body: string }) {
  return (
    <div className="pres-card">
      <h3 className="pres-card-title">{title}</h3>
      <p className="pres-card-body">{body}</p>
    </div>
  )
}

// ─── Slides ────────────────────────────────────────────────────────────
const SLIDES: DeckEntry[] = [
  {
    meta: { kicker: 'GRADUATION PROJECT', title: 'CourseFlix' },
    render: () => (
      <div className="pres-hero">
        <span className="pres-logo">COURSEFLIX</span>
        <p className="pres-hero-sub">An Arabic-First Online Learning Platform</p>
        <p className="pres-hero-tag">
          Full-stack LMS · RAG AI Tutor · Learning Interventions · Paymob Payments · Sales Analytics
        </p>
        <div className="pres-hero-team">
          <span className="pres-hero-label">Team Members</span>
          <div className="pres-avatars">
            <div className="pres-avatar" title="Abdallah Ahmed Hassan Habsa">
              <span className="pres-avatar-initials">AH</span>
              <span className="pres-avatar-name">Abdallah Habsa</span>
            </div>
            <div className="pres-avatar" title="Albraa Mahfouz Abdalaziz Nawara">
              <span className="pres-avatar-initials">AN</span>
              <span className="pres-avatar-name">Albraa Nawara</span>
            </div>
            <div className="pres-avatar" title="Mahmoud Nabil Mahmoud Abohessain">
              <span className="pres-avatar-initials">MA</span>
              <span className="pres-avatar-name">Mahmoud Abohessain</span>
            </div>
            <div className="pres-avatar" title="Mohamed Reda Galal Elgendy">
              <span className="pres-avatar-initials">ME</span>
              <span className="pres-avatar-name">Mohamed Elgendy</span>
            </div>
            <div className="pres-avatar" title="Seif-Allah Ahmed Mostafa Eldarageely">
              <span className="pres-avatar-initials">SE</span>
              <span className="pres-avatar-name">Seif-Allah Eldarageely</span>
            </div>
          </div>
          <p className="pres-hero-supervisor">Supervisor: Eng. Ayaat Abdelazim</p>
        </div>
      </div>
    ),
  },
  {
    meta: { kicker: 'AGENDA', title: 'Agenda' },
    render: () => (
      <ol className="pres-agenda">
        {[
          ['1', 'Introduction'],
          ['2', 'Overview'],
          ['3', 'User Journey'],
          ['4', 'Objectives'],
          ['5', 'Technologies Used'],
          ['6', 'System Features'],
          ['7', 'System Architecture'],
          ['8', 'Backend Walkthrough'],
          ['9', 'Frontend Walkthrough'],
          ['10', 'Screens · Auth'],
          ['11', 'Screens · Student'],
          ['12', 'Screens · In Sync'],
          ['13', 'Screens · Settings'],
          ['14', 'System Demonstration'],
          ['15', 'Future Enhancements'],
          ['16', 'Conclusion'],
        ].map(([num, label]) => (
          <li key={num} className="pres-agenda-item">
            <span className="pres-agenda-num">{num}</span>
            <span className="pres-agenda-label">{label}</span>
          </li>
        ))}
      </ol>
    ),
  },
  {
    meta: { kicker: 'INTRODUCTION', title: 'Introduction' },
    render: () => (
      <SlideShell meta={{ kicker: 'INTRODUCTION', title: 'Introduction' }}>
        <p className="pres-lead">
          CourseFlix is an Arabic-first, RTL online learning platform that connects teachers and
          students in a complete learning loop — from publishing course content to assessing,
          intervening, and paying for courses.
        </p>
        <div className="pres-grid pres-grid-3">
          <Card title="Student Experience" body="Enrolled-course dashboard, lessons with resume + attendance, server-graded quizzes, course-scoped AI Tutor, notifications, interventions, and checkout." />
          <Card title="Teacher Experience" body="Course/section/lesson management, PDF upload with ingestion, quizzes, announcements, discussions, sales metrics, a limited Analytics Agent, and agent logs." />
          <Card title="Assistant & Admin" body="Assistants share the teacher course/student surface; admins oversee users, courses, orders, quizzes, documents, notifications, and agent logs." />
        </div>
      </SlideShell>
    ),
  },
  {
    meta: { kicker: 'OVERVIEW', title: 'Platform Overview' },
    render: () => (
      <SlideShell meta={{ kicker: 'OVERVIEW', title: 'Platform Overview' }}>
        <p className="pres-lead">
          A single platform covering the whole learning loop — from how a course is structured to
          how students learn, get assessed, and receive help.
        </p>
        <div className="pres-overview">
          <div className="pres-overview-row">
            <span className="pres-overview-label">Publish</span>
            <span className="pres-overview-desc">Teachers structure courses into sections and lessons, upload PDFs, and post announcements.</span>
          </div>
          <div className="pres-overview-row">
            <span className="pres-overview-label">Practice</span>
            <span className="pres-overview-desc">Students watch lessons with resume + attendance and take objective quizzes.</span>
          </div>
          <div className="pres-overview-row">
            <span className="pres-overview-label">Assess</span>
            <span className="pres-overview-desc">Server-side grading, interventions, and weak-concept reports flag struggles early.</span>
          </div>
          <div className="pres-overview-row">
            <span className="pres-overview-label">Feedback</span>
            <span className="pres-overview-desc">AI Tutor answers with citations, sales/analytics surface outcomes, and notifications keep everyone in sync.</span>
          </div>
        </div>
      </SlideShell>
    ),
  },
  {
    meta: { kicker: 'USER JOURNEY', title: 'User Journey' },
    render: () => (
      <SlideShell meta={{ kicker: 'USER JOURNEY', title: 'User Journey' }}>
        <p className="pres-lead">
          A full learning loop told from the student and teacher perspectives.
        </p>
        <div className="pres-journey">
          <div className="pres-journey-col">
            <span className="pres-journey-head">Student</span>
            <ul className="pres-journey-list">
              <li><b>Enroll</b> — browse published courses and sign up</li>
              <li><b>Learn</b> — watch lessons, resume progress, gain attendance</li>
              <li><b>Assess</b> — take server-graded quizzes</li>
              <li><b>Ask</b> — query the AI Tutor with cited answers</li>
              <li><b>Buy</b> — check out with Paymob and get a receipt</li>
              <li><b>Get help</b> — interventions and support tickets</li>
            </ul>
          </div>
          <div className="pres-journey-col">
            <span className="pres-journey-head">Teacher</span>
            <ul className="pres-journey-list">
              <li><b>Structure</b> — courses → sections → lessons</li>
              <li><b>Upload</b> — PDFs become searchable by the Tutor</li>
              <li><b>Assess</b> — quizzes from a shared question bank</li>
              <li><b>Monitor</b> — progress reports and interventions</li>
              <li><b>Sell</b> — sales metrics and the Analytics Agent</li>
              <li><b>Engage</b> — announcements, discussions, support</li>
            </ul>
          </div>
        </div>
      </SlideShell>
    ),
  },
  {
    meta: { kicker: 'OBJECTIVES', title: 'Project Objectives' },
    render: () => (
      <SlideShell meta={{ kicker: 'OBJECTIVES', title: 'Project Objectives' }}>
        <ul className="pres-objectives">
          <li>Deliver an Arabic-First RTL learning experience based on the approved UI design.</li>
          <li>Let teachers structure courses into sections and lessons, upload PDFs, and post announcements.</li>
          <li>Let students watch lessons, track progress, and get server-graded quiz results.</li>
          <li>Provide a grounded, honest AI Tutor that answers only from the teacher's documents with citations.</li>
          <li>Add deterministic learning interventions that never auto-suspend a student.</li>
          <li>Enable secure course payments via Paymob with backend-sourced orders and receipts.</li>
          <li>Give teachers backend-sourced sales metrics and a limited Analytics Agent.</li>
          <li>Keep everything traceable and privacy-safe (correlation IDs, redacted logs, PII-denylisted analytics).</li>
        </ul>
      </SlideShell>
    ),
  },
  {
    meta: { kicker: 'TECHNOLOGIES', title: 'Technologies Used' },
    render: () => (
      <SlideShell meta={{ kicker: 'TECHNOLOGIES', title: 'Technologies Used' }}>
        <div className="pres-grid pres-grid-4">
          <Card title="Frontend" body="React + TypeScript\nVite · React Router · TanStack Query\nTailwindCSS + custom design tokens\nArabic RTL responsive UI" />
          <Card title="Backend" body="NestJS + TypeScript\nREST API · DTO validation · guards\nTypeORM migrations (PostgreSQL)\nArgon2id + signed session cookies" />
          <Card title="AI & Data" body="ChromaDB vector store\nBullMQ + Redis job queue\nOpenAI embeddings/LLM (provider-agnostic)\nDeterministic mock providers for tests" />
          <Card title="Infra & Tests" body="npm workspaces monorepo\nDocker Compose (Postgres/Redis/Chroma)\nJest + Supertest · Vitest + RTL + MSW\ndev.sh one-command launcher" />
        </div>
      </SlideShell>
    ),
  },
  {
    meta: { kicker: 'SYSTEM FEATURES', title: 'System Features' },
    render: () => (
      <SlideShell meta={{ kicker: 'SYSTEM FEATURES', title: 'System Features' }}>
        <div className="pres-features">
          {[
            ['Auth & Roles', 'Password + Google OTP sign-in, role guards, sessions'],
            ['Course Delivery', 'Sections → lessons, resume playback, attendance'],
            ['Graded Quizzes', 'Server-side grading, question bank, one attempt'],
            ['AI Tutor (RAG)', 'Cited answers from course docs, honest no-answer'],
            ['Video Q&A', 'Transcript-grounded assistant per video'],
            ['Interventions', 'Weak-concept reports + mini-quiz, no auto-suspend'],
            ['Notifications', 'Filterable feed, mark-read, deep links'],
            ['Community', 'Discussions, announcements with attachments'],
            ['Paymob Payments', 'Real checkout with Paymob gateway, backend order truth'],
            ['Sales & Analytics', 'Backend metrics + limited Analytics Agent'],
            ['Support', 'Tickets routed to support staff'],
            ['Admin Oversight', 'Users, courses, orders, logs, notifications'],
          ].map(([t, d]) => (
            <div key={t} className="pres-feature">
              <span className="pres-feature-check">✓</span>
              <span className="pres-feature-text">
                <strong>{t}</strong>
                <small>{d}</small>
              </span>
            </div>
          ))}
        </div>
      </SlideShell>
    ),
  },
  {
    meta: { kicker: 'ARCHITECTURE', title: 'System Architecture' },
    render: () => (
      <SlideShell meta={{ kicker: 'ARCHITECTURE', title: 'System Architecture' }}>
        <div className="pres-arch">
          <div className="pres-arch-col">
            <div className="pres-node pres-node-web">
              <strong>Web (React)</strong>
              <span>Vite SPA · RTL UI</span>
            </div>
            <div className="pres-node pres-node-worker">
              <strong>Worker (NestJS)</strong>
              <span>BullMQ ingestion</span>
            </div>
          </div>
          <div className="pres-arch-center">
            <div className="pres-node pres-node-api">
              <strong>API (NestJS)</strong>
              <span>REST · Guards · DTO validation</span>
            </div>
          </div>
          <div className="pres-arch-col">
            <div className="pres-node">
              <strong>PostgreSQL</strong>
              <span>TypeORM · migrations</span>
            </div>
            <div className="pres-node">
              <strong>Redis</strong>
              <span>BullMQ job queue</span>
            </div>
            <div className="pres-node">
              <strong>ChromaDB</strong>
              <span>vector store · isolation</span>
            </div>
            <div className="pres-node">
              <strong>AI Providers</strong>
              <span>OpenAI LLM + embeddings</span>
            </div>
          </div>
        </div>
      </SlideShell>
    ),
  },
  {
    meta: { kicker: 'BACKEND WALKTHROUGH', title: 'Backend Overview — Auth, Courses, Lessons' },
    render: () => (
      <SlideShell
        meta={{ kicker: 'BACKEND WALKTHROUGH', title: 'Backend Overview — Auth, Courses, Lessons' }}
      >
        <BackendTable
          rows={[
            ['/api/auth', 'POST', '/login', 'Sign in with email/password, sets session cookie'],
            ['/api/auth', 'POST', '/register', 'Student self-registration + verification OTP'],
            ['/api/auth/oauth', 'GET', '/google', 'Start Google "Continue with Google" flow'],
            ['/api/auth/otp', 'POST', '/verify', 'Redeem OTP (register / google_oauth), open session'],
            ['/api/courses', 'GET', '/:courseId', 'Course detail (enrolled student / owning teacher)'],
            ['/api/courses', 'POST', '/:courseId/sections', 'Create a section in a course'],
            ['/api/lessons', 'PATCH', '/:lessonId/progress', 'Report video progress (heartbeat, attendance)'],
            ['/api/me', 'GET', '/', 'Current authenticated user'],
          ]}
        />
      </SlideShell>
    ),
  },
  {
    meta: { kicker: 'BACKEND WALKTHROUGH', title: 'Backend Overview — Quizzes, Tutor, Commerce' },
    render: () => (
      <SlideShell
        meta={{ kicker: 'BACKEND WALKTHROUGH', title: 'Backend Overview — Quizzes, Tutor, Commerce' }}
      >
        <BackendTable
          rows={[
            ['/api/quizzes', 'GET', '/:quizId', 'Quiz detail (answer key never serialized)'],
            ['/api/quizzes', 'POST', '/:quizId/submissions', 'Submit answers, server-side grading (409 on retry)'],
            ['/api/courses', 'POST', '/:courseId/tutor/messages', 'Ask the AI Tutor (RAG citations or no-answer)'],
            ['/api/checkout', 'POST', '/orders', 'Create draft order with server-set price'],
            ['/api/checkout', 'POST', '/orders/:id/confirm', 'Confirm order, start Paymob payment flow'],
            ['/api/orders', 'GET', '/:orderId', 'Fetch order + receipt (backend financial truth)'],
            ['/api/teacher/sales', 'GET', '/summary', 'Revenue, order count, best-seller (paid only)'],
            ['/api/teacher/analytics', 'POST', '/questions', 'Analytics Agent (3 allowlisted intents)'],
          ]}
        />
      </SlideShell>
    ),
  },
  {
    meta: { kicker: 'FRONTEND WALKTHROUGH', title: 'Frontend Overview — Student & Teacher' },
    render: () => (
      <SlideShell meta={{ kicker: 'FRONTEND WALKTHROUGH', title: 'Frontend Overview — Student & Teacher' }}>
        <FrontendList
          items={[
            ['Login / Register', 'Email+password or Google OTP step; role-guarded redirect; reset password.'],
            ['Student Dashboard', 'Enrolled courses with progress and status; course detail with sections/lessons.'],
            ['Lesson Player', 'Video playback with resume, throttled heartbeat, and attendance progress.'],
            ['Quiz Page', 'Objective quiz, one attempt, immediate server-graded result.'],
            ['AI Tutor Chat', 'Ask about the course; see cited answers or an explicit no-answer.'],
            ['Teacher Dashboard', 'Course/section/lesson management and progress overview.'],
          ]}
        />
      </SlideShell>
    ),
  },
  {
    meta: { kicker: 'FRONTEND WALKTHROUGH', title: 'Frontend Overview — Community, Commerce, Admin' },
    render: () => (
      <SlideShell
        meta={{ kicker: 'FRONTEND WALKTHROUGH', title: 'Frontend Overview — Community, Commerce, Admin' }}
      >
        <FrontendList
          items={[
            ['Files Tab', 'Upload PDFs, watch ingestion status (pending → processing → done/failed).'],
            ['Notifications', 'Filterable feed, mark one/all read, deep-link to the exact entity.'],
            ['Interventions', 'Weak-concept report and mini-quiz views for students and teachers.'],
            ['Checkout & Receipt', 'Deterministic payment flow with loading/declined/success states.'],
            ['Sales & Analytics', 'Sales summary and the limited Analytics Agent UI.'],
            ['Admin Pages', 'Users, courses, orders, quizzes, documents, notifications log, agent logs.'],
          ]}
        />
      </SlideShell>
    ),
  },
  {
    meta: { kicker: 'UI OVERVIEW · 1/4', title: 'Auth Screens' },
    render: () => (
      <SlideShell meta={{ kicker: 'UI OVERVIEW · 1/4', title: 'Auth Screens' }}>
        <p className="pres-lead">Sign in with email/password or Google OTP, and student self-registration.</p>
        <div className="pres-shots pres-shots--pair">
          <figure className="pres-shot pres-shot--big">
            <img src={shotLogin} alt="Login screen" loading="lazy" />
            <figcaption>Login</figcaption>
          </figure>
          <figure className="pres-shot pres-shot--big">
            <img src={shotRegister} alt="Register screen" loading="lazy" />
            <figcaption>Register</figcaption>
          </figure>
        </div>
      </SlideShell>
    ),
  },
  {
    meta: { kicker: 'UI OVERVIEW · 2/4', title: 'Student Experience' },
    render: () => (
      <SlideShell meta={{ kicker: 'UI OVERVIEW · 2/4', title: 'Student Experience' }}>
        <p className="pres-lead">Dashboard with enrolled courses, and a structured course detail page.</p>
        <div className="pres-shots pres-shots--pair">
          <figure className="pres-shot pres-shot--big">
            <img src={shotStudentDashboard} alt="Student dashboard" loading="lazy" />
            <figcaption>Student Dashboard</figcaption>
          </figure>
          <figure className="pres-shot pres-shot--big">
            <img src={shotCourseDetail} alt="Course detail" loading="lazy" />
            <figcaption>Course Detail</figcaption>
          </figure>
        </div>
      </SlideShell>
    ),
  },
  {
    meta: { kicker: 'UI OVERVIEW · 3/4', title: 'Stay In Sync' },
    render: () => (
      <SlideShell meta={{ kicker: 'UI OVERVIEW · 3/4', title: 'Stay In Sync' }}>
        <p className="pres-lead">Notifications with deep-links, and the course community (discussions + announcements).</p>
        <div className="pres-shots pres-shots--pair">
          <figure className="pres-shot pres-shot--big">
            <img src={shotNotifications} alt="Notifications" loading="lazy" />
            <figcaption>Notifications</figcaption>
          </figure>
          <figure className="pres-shot pres-shot--big">
            <img src={shotCommunity} alt="Community" loading="lazy" />
            <figcaption>Community</figcaption>
          </figure>
        </div>
      </SlideShell>
    ),
  },
  {
    meta: { kicker: 'UI OVERVIEW · 4/4', title: 'Personalize & Manage' },
    render: () => (
      <SlideShell meta={{ kicker: 'UI OVERVIEW · 4/4', title: 'Personalize & Manage' }}>
        <p className="pres-lead">Settings for theme, notifications and account preferences.</p>
        <div className="pres-shots pres-shots--pair">
          <figure className="pres-shot pres-shot--big">
            <img src={shotSettings} alt="Settings" loading="lazy" />
            <figcaption>Settings</figcaption>
          </figure>
          <div className="pres-shot pres-shot--big pres-shot--placeholder">
            <span className="pres-shot-placeholder-icon">☰</span>
            <figcaption>Teacher & Admin dashboards</figcaption>
          </div>
        </div>
      </SlideShell>
    ),
  },
  {
    meta: { kicker: 'DEMONSTRATION', title: 'System Demonstration' },
    render: () => (
      <SlideShell meta={{ kicker: 'DEMONSTRATION', title: 'System Demonstration' }}>
        <div className="pres-demo">
          <span className="pres-demo-play">▶</span>
          <p className="pres-demo-title">Video Link</p>
          <p className="pres-demo-desc">
            Live end-to-end demo: teacher publishes a lesson and uploads a PDF → student learns, asks
            the Tutor, triggers an intervention, and completes checkout → teacher reviews sales and
            agent logs.
          </p>
        </div>
      </SlideShell>
    ),
  },
  {
    meta: { kicker: 'FUTURE', title: 'Future Enhancements' },
    render: () => (
      <SlideShell meta={{ kicker: 'FUTURE', title: 'Future Enhancements' }}>
        <ul className="pres-future">
          {[
            'Paymob expansion — recurring plans, coupons, and multi-currency support.',
            'Advanced AI Tutor — conversation memory summaries and expanded grounding.',
            'AI quiz generation — generate quizzes directly from uploaded documents.',
            'Progress reports — automated weekly teacher reports for at-risk students.',
            'Mobile app — React Native or Flutter clients.',
            'Deployment on Render/AWS — Docker containers with managed Postgres and Redis.',
            'Notifications delivery — email/SMS channels beyond in-app notifications.',
            'Expanded analytics — richer charts and more allowlisted intents.',
          ].map((f, i) => (
            <li key={i}>
              <span className="pres-future-num">{i + 1}</span>
              {f}
            </li>
          ))}
        </ul>
      </SlideShell>
    ),
  },
  {
    meta: { kicker: 'CONCLUSION', title: 'Conclusion' },
    render: () => (
      <SlideShell meta={{ kicker: 'CONCLUSION', title: 'Conclusion' }}>
        <div className="pres-conclusion">
          <p className="pres-conclusion-lead">CourseFlix demonstrates a complete, production-hardened learning platform:</p>
          <p><strong>Grounded AI</strong> — a cited, honest Tutor that answers only from the teacher's documents.</p>
          <p><strong>Deterministic quality</strong> — server-side grading, versioned quizzes, and rule-based interventions that never auto-suspend.</p>
          <p><strong>Financial truth</strong> — backend orders as the single source of truth for sales and receipts.</p>
          <p><strong>Privacy-safe</strong> — correlation IDs, redacted logs, and PII-denylisted analytics.</p>
          <p className="pres-conclusion-italic">It brings teachers and students into one coherent, measurable learning loop.</p>
        </div>
      </SlideShell>
    ),
  },
  {
    meta: { kicker: 'REFERENCES', title: 'References' },
    render: () => (
      <SlideShell meta={{ kicker: 'REFERENCES', title: 'References' }}>
        <ul className="pres-references">
          <li>GitHub Repository — github.com/Xmerlin7/CourseFlix</li>
          <li>API Documentation — OpenAPI / Postman collection</li>
          <li>Database Schema — schemaV2.sql (PostgreSQL, 35 tables)</li>
          <li>Project Plans — Sprint 1/2/3 plans and Scrum/Jira backlog</li>
          <li>UI Design — approved ui5 handoff</li>
        </ul>
      </SlideShell>
    ),
  },
  {
    meta: { kicker: 'THANK YOU', title: 'Thank You!' },
    render: () => (
      <div className="pres-thanks">
        <h2 className="pres-thanks-title">Thank You!</h2>
        <p className="pres-thanks-sub">Feel free to ask any questions</p>
        <div className="pres-avatars pres-avatars--thanks">
          <div className="pres-avatar" title="Abdallah Ahmed Hassan Habsa">
            <span className="pres-avatar-initials">AH</span>
            <span className="pres-avatar-name">Abdallah Habsa</span>
          </div>
          <div className="pres-avatar" title="Albraa Mahfouz Abdalaziz Nawara">
            <span className="pres-avatar-initials">AN</span>
            <span className="pres-avatar-name">Albraa Nawara</span>
          </div>
          <div className="pres-avatar" title="Mahmoud Nabil Mahmoud Abohessain">
            <span className="pres-avatar-initials">MA</span>
            <span className="pres-avatar-name">Mahmoud Abohessain</span>
          </div>
          <div className="pres-avatar" title="Mohamed Reda Galal Elgendy">
            <span className="pres-avatar-initials">ME</span>
            <span className="pres-avatar-name">Mohamed Elgendy</span>
          </div>
          <div className="pres-avatar" title="Seif-Allah Ahmed Mostafa Eldarageely">
            <span className="pres-avatar-initials">SE</span>
            <span className="pres-avatar-name">Seif-Allah Eldarageely</span>
          </div>
        </div>
        <p className="pres-thanks-supervisor">Supervisor: Eng. Ayaat Abdelazim</p>
      </div>
    ),
  },
]

// ─── Backend table ─────────────────────────────────────────────────────
function BackendTable({ rows }: { rows: Array<[string, string, string, string]> }) {
  return (
    <div className="pres-table-wrap">
      <table className="pres-table">
        <thead>
          <tr>
            <th>Endpoint</th>
            <th>Method</th>
            <th>Path</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([ep, method, path, desc]) => (
            <tr key={`${ep}${method}${path}`}>
              <td className="pres-td-ep">{ep}</td>
              <td className="pres-td-method">{method}</td>
              <td className="pres-td-path">{path}</td>
              <td className="pres-td-desc">{desc}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── Frontend list ─────────────────────────────────────────────────────
function FrontendList({ items }: { items: Array<[string, string]> }) {
  return (
    <ul className="pres-frontend">
      {items.map(([t, d]) => (
        <li key={t} className="pres-frontend-item">
          <span className="pres-frontend-t">{t}</span>
          <span className="pres-frontend-d">{d}</span>
        </li>
      ))}
    </ul>
  )
}

// ─── Deck controller ───────────────────────────────────────────────────
export function PresentationPage() {
  const navigate = useNavigate()
  const { mode, resolvedTheme, setMode } = useTheme()
  const [index, setIndex] = useState(0)
  const [direction, setDirection] = useState<1 | -1>(1)
  const total = SLIDES.length
  const touchX = useRef<number | null>(null)

  const cycleTheme = useCallback(() => {
    // light → dark → system
    const nextMode = mode === 'light' ? 'dark' : mode === 'dark' ? 'system' : 'light'
    setMode(nextMode)
  }, [mode, setMode])

  const goTo = useCallback(
    (next: number, dir: 1 | -1) => {
      setIndex((current) => {
        const clamped = Math.min(total - 1, Math.max(0, next))
        setDirection(dir)
        return clamped
      })
    },
    [total],
  )

  const next = useCallback(() => goTo(index + 1, 1), [goTo, index])
  const prev = useCallback(() => goTo(index - 1, -1), [goTo, index])

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown' || event.key === ' ') {
        event.preventDefault()
        next()
      } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
        event.preventDefault()
        prev()
      } else if (event.key === 'Escape') {
        navigate('/')
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [next, prev, navigate])

  const current = useMemo(() => SLIDES[index], [index])

  return (
    <div
      className="pres-root"
      onTouchStart={(e) => {
        touchX.current = e.touches[0].clientX
      }}
      onTouchEnd={(e) => {
        if (touchX.current === null) return
        const delta = e.changedTouches[0].clientX - touchX.current
        if (Math.abs(delta) > 48) {
          if (delta < 0) next()
          else prev()
        }
        touchX.current = null
      }}
    >
      <div
        key={index}
        className={`pres-stage pres-anim-${direction}`}
        role="group"
        aria-roledescription="slide"
        aria-label={`Slide ${index + 1} of ${total}`}
      >
        {current.render(current.meta)}
      </div>

      <nav className="pres-controls">
        <button type="button" className="pres-btn" onClick={prev} disabled={index === 0} aria-label="Previous slide">
          ‹
        </button>
        <span className="pres-counter">{index + 1} / {total}</span>
        <button type="button" className="pres-btn" onClick={next} disabled={index === total - 1} aria-label="Next slide">
          ›
        </button>
      </nav>

      <div className="pres-dots" role="tablist" aria-label="Slides">
        {SLIDES.map((slide, i) => (
          <button
            key={slide.meta.title}
            type="button"
            className={`pres-dot${i === index ? ' active' : ''}`}
            onClick={() => goTo(i, i > index ? 1 : -1)}
            aria-label={slide.meta.title}
            aria-selected={i === index}
          />
        ))}
      </div>

      <button type="button" className="pres-exit" onClick={() => navigate('/')} aria-label="Exit presentation">
        ✕
      </button>

      <button
        type="button"
        className="pres-theme"
        onClick={cycleTheme}
        aria-label={`Switch theme (current: ${resolvedTheme})`}
        title={`Theme: ${resolvedTheme}`}
      >
        <span className="pres-theme-icon" aria-hidden="true">{resolvedTheme === 'dark' ? '☾' : '☀'}</span>
      </button>
    </div>
  )
}
