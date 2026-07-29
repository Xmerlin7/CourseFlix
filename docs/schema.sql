-- =====================================================================
-- CourseFlix — Relational (PostgreSQL) Schema
-- Translated from the CourseFlix v2 MongoDB document schema.
-- =====================================================================
--
-- NOTES ON TRANSLATION FROM THE DOCUMENT MODEL
-- ---------------------------------------------------------------------
-- 1. `_id` (ObjectId)            -> UUID primary key, default gen_random_uuid()
-- 2. Embedded objects            -> either flattened into columns (small,
--                                   1:1, e.g. users.settings) or normalized
--                                   into their own table (unbounded arrays,
--                                   e.g. quiz_submissions.answers)
-- 3. Reference arrays             -> junction/bridge tables
--                                   (e.g. quizzes.question_ids -> quiz_questions)
-- 4. Enum[...] fields             -> native PostgreSQL ENUM types
-- 5. Polymorphic references       -> either (a) exclusive nullable FK columns
--                                   with a CHECK constraint (content_progress),
--                                   or (b) a loose (entity_type, entity_id)
--                                   pair with no enforced FK, documented inline
--                                   (agent_logs, ai_jobs, activity_logs,
--                                   notifications, student_events) — this is
--                                   the standard trade-off for polymorphic
--                                   associations in an RDBMS.
-- 6. `deleted_at`                 -> kept as-is (soft delete); all "read"
--                                   queries in the app layer must filter
--                                   `WHERE deleted_at IS NULL`.
--
-- FOREIGN KEY DELETE POLICY (applied consistently below)
-- ---------------------------------------------------------------------
-- - courses(id)   parent of nearly everything -> ON DELETE CASCADE
--   (a course and its curriculum are a single aggregate)
-- - users(id)     referenced by academic/audit records -> ON DELETE RESTRICT
--   (never silently lose grading/audit history when a user row is removed;
--   deactivate via users.status/deleted_at instead)
--   Exception: sessions.user_id -> ON DELETE CASCADE (pure auth artifact)
-- - sections(id) / lessons(id)  -> ON DELETE SET NULL
--   (losing a curriculum slot shouldn't destroy the underlying content)
-- - documents(id) -> ON DELETE CASCADE for its own children
--   (document_chunks, knowledge_nodes), SET NULL elsewhere
-- - quizzes(id) / homework(id) -> ON DELETE RESTRICT from *_submissions
--   (grades must never disappear because a quiz/homework was deleted;
--   use quizzes.deleted_at / homework.deleted_at instead)
--
-- =====================================================================


-- =====================================================================
-- 0. EXTENSIONS
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;  -- for gen_random_uuid()


-- =====================================================================
-- 1. ENUM TYPES
-- =====================================================================

CREATE TYPE user_role                    AS ENUM ('student', 'teacher');
CREATE TYPE user_status                  AS ENUM ('active', 'suspended', 'inactive');
CREATE TYPE permission_key               AS ENUM ('admin', 'teaching_assistant', 'support');

CREATE TYPE course_status                AS ENUM ('draft', 'published', 'archived');

CREATE TYPE enrollment_status            AS ENUM ('active', 'suspended', 'completed');
CREATE TYPE status_changed_by_type       AS ENUM ('system_agent', 'teacher');

CREATE TYPE content_status               AS ENUM ('draft', 'published');   -- sections & lessons

CREATE TYPE document_file_type           AS ENUM ('pdf', 'pptx');
CREATE TYPE processing_status_type       AS ENUM ('pending', 'processing', 'completed', 'failed');

CREATE TYPE question_type                AS ENUM ('mcq', 'true_false', 'short_answer');

CREATE TYPE video_type                   AS ENUM ('recorded', 'live');
CREATE TYPE video_status                 AS ENUM ('scheduled', 'live', 'ended', 'recorded');

CREATE TYPE quiz_generation_type         AS ENUM ('manual', 'rag_generated');

CREATE TYPE homework_lifecycle_status    AS ENUM ('draft', 'published', 'open', 'closed', 'archived');
CREATE TYPE homework_submission_status   AS ENUM ('submitted', 'graded', 'late');
CREATE TYPE graded_by_type               AS ENUM ('ai_assistant', 'teacher');

CREATE TYPE chat_conversation_status     AS ENUM ('active', 'closed');
CREATE TYPE chat_sender_type             AS ENUM ('student', 'ai_tutor');
CREATE TYPE chat_role                    AS ENUM ('user', 'assistant', 'system');
CREATE TYPE moderation_status_type       AS ENUM ('pending', 'approved', 'blocked');

CREATE TYPE notification_type            AS ENUM ('hw_assigned', 'quiz_ready', 'progress_report', 'announcement', 'course_update', 'system');
CREATE TYPE notification_priority        AS ENUM ('low', 'normal', 'high', 'critical');

CREATE TYPE agent_type                   AS ENUM ('content_scout', 'proactive_proctor', 'tutor_llm');
CREATE TYPE agent_log_status             AS ENUM ('success', 'failed', 'retrying');

CREATE TYPE ai_job_status                AS ENUM ('queued', 'processing', 'completed', 'failed');

CREATE TYPE student_event_type           AS ENUM ('enrolled', 'homework_failed', 'warning_issued', 'suspended', 'restored', 'other');

CREATE TYPE content_progress_status      AS ENUM ('not_started', 'in_progress', 'completed');
CREATE TYPE content_progress_item_type   AS ENUM ('video', 'quiz', 'homework', 'lesson');


-- =====================================================================
-- 2. CORE IDENTITY & COURSE STRUCTURE
-- =====================================================================

-- ---------------------------------------------------------------------
-- users
-- ---------------------------------------------------------------------
CREATE TABLE users (
    id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name                TEXT NOT NULL,
    email                    TEXT NOT NULL UNIQUE,
    password_hash            TEXT NOT NULL,
    role                     user_role NOT NULL,
    avatar_url               TEXT,

    -- embedded `settings` object -> flattened / JSONB for the free-form part
    settings_theme                    TEXT DEFAULT 'system',
    settings_language                 TEXT DEFAULT 'en',
    settings_email_notifications      BOOLEAN DEFAULT TRUE,
    settings_notification_preferences JSONB DEFAULT '{}'::jsonb,  -- per-type booleans, e.g. {"hw_assigned": true}

    status                   user_status NOT NULL DEFAULT 'active',
    last_login_at            TIMESTAMPTZ,
    deleted_at               TIMESTAMPTZ,
    created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- users.permissions (Array<String>) -> normalized junction table
CREATE TABLE user_permissions (
    user_id                  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    permission               permission_key NOT NULL,
    granted_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, permission)
);

-- ---------------------------------------------------------------------
-- sessions
-- ---------------------------------------------------------------------
CREATE TABLE sessions (
    id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    refresh_token_hash       TEXT NOT NULL,
    device_info              TEXT,
    ip_address               INET,
    expires_at               TIMESTAMPTZ NOT NULL,
    created_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- files  (centralised asset management)
-- ---------------------------------------------------------------------
CREATE TABLE files (
    id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_name                TEXT NOT NULL,
    mime_type                TEXT NOT NULL,
    size_bytes               BIGINT NOT NULL,
    storage_provider         TEXT NOT NULL,             -- e.g. 's3', 'gcs'
    storage_path             TEXT NOT NULL,
    checksum                 TEXT NOT NULL,              -- SHA256, dedup key
    uploaded_by              UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- courses
-- ---------------------------------------------------------------------
CREATE TABLE courses (
    id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id               UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    title                    TEXT NOT NULL,
    description               TEXT,
    thumbnail_url             TEXT,
    category                  TEXT,
    status                    course_status NOT NULL DEFAULT 'draft',
    max_students              INTEGER,
    deleted_at                TIMESTAMPTZ,
    created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- sections  (a.k.a. modules)
-- ---------------------------------------------------------------------
CREATE TABLE sections (
    id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id                UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title                    TEXT NOT NULL,
    order_index              INTEGER NOT NULL,
    unlock_at                TIMESTAMPTZ,        -- drip-content scheduling
    status                   content_status NOT NULL DEFAULT 'draft',
    deleted_at               TIMESTAMPTZ
);

-- ---------------------------------------------------------------------
-- lessons
-- ---------------------------------------------------------------------
CREATE TABLE lessons (
    id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    section_id               UUID NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
    course_id                UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,  -- denormalized for fast lookups
    title                    TEXT NOT NULL,
    description               TEXT,
    order_index              INTEGER NOT NULL,
    estimated_duration_min   INTEGER,
    unlock_at                TIMESTAMPTZ,        -- optional lesson-level override
    status                   content_status NOT NULL DEFAULT 'draft',
    deleted_at               TIMESTAMPTZ
);

-- ---------------------------------------------------------------------
-- enrollments
-- ---------------------------------------------------------------------
CREATE TABLE enrollments (
    id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id               UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    course_id                UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    status                   enrollment_status NOT NULL DEFAULT 'active',
    suspended_reason          TEXT,
    suspended_at              TIMESTAMPTZ,
    suspended_by_submission_id UUID,  -- FK added after homework_submissions is created (see §6)
    status_changed_by        status_changed_by_type,
    override_active          BOOLEAN NOT NULL DEFAULT FALSE,
    progress_percentage      NUMERIC(5,2),  -- legacy; superseded by content_progress aggregation
    enrolled_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at                TIMESTAMPTZ,
    CONSTRAINT uq_enrollments_student_course UNIQUE (student_id, course_id)
);


-- =====================================================================
-- 3. RAG / DOCUMENT PIPELINE
-- =====================================================================

-- ---------------------------------------------------------------------
-- documents
-- ---------------------------------------------------------------------
CREATE TABLE documents (
    id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id                UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    section_id               UUID REFERENCES sections(id) ON DELETE SET NULL,
    lesson_id                UUID REFERENCES lessons(id) ON DELETE SET NULL,
    uploaded_by               UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    file_id                   UUID REFERENCES files(id) ON DELETE SET NULL,
    file_name                 TEXT NOT NULL,
    file_type                 document_file_type NOT NULL,
    processing_status         processing_status_type NOT NULL DEFAULT 'pending',
    vector_namespace          TEXT,
    checksum                  TEXT,               -- SHA256 dedup
    version                   INTEGER NOT NULL DEFAULT 1,
    deleted_at                TIMESTAMPTZ,         -- triggers async ChromaDB vector purge
    created_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- document_chunks
-- ---------------------------------------------------------------------
CREATE TABLE document_chunks (
    id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id               UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    chunk_index                INTEGER NOT NULL,
    text_preview               TEXT,               -- full text lives in ChromaDB payload
    vector_id                  TEXT NOT NULL,       -- bridges Postgres <-> ChromaDB
    page_number                INTEGER,
    token_count                INTEGER,
    is_active                  BOOLEAN NOT NULL DEFAULT TRUE,
    deleted_at                 TIMESTAMPTZ
);

-- ---------------------------------------------------------------------
-- knowledge_nodes  (+ self-referencing graph edges)
-- ---------------------------------------------------------------------
CREATE TABLE knowledge_nodes (
    id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id                 UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    document_id                UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    concept                    TEXT NOT NULL,
    importance_score           NUMERIC(5,2),
    version                    INTEGER NOT NULL DEFAULT 1,
    deleted_at                 TIMESTAMPTZ
);

-- knowledge_nodes.related_node_ids (Array<ObjectId>, self-reference) -> edge table
CREATE TABLE knowledge_node_edges (
    node_id                   UUID NOT NULL REFERENCES knowledge_nodes(id) ON DELETE CASCADE,
    related_node_id            UUID NOT NULL REFERENCES knowledge_nodes(id) ON DELETE CASCADE,
    PRIMARY KEY (node_id, related_node_id),
    CONSTRAINT chk_knowledge_edge_not_self CHECK (node_id <> related_node_id)
);


-- =====================================================================
-- 4. VIDEOS & ATTENDANCE
-- =====================================================================

CREATE TABLE videos (
    id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id                 UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    section_id                UUID REFERENCES sections(id) ON DELETE SET NULL,
    lesson_id                 UUID REFERENCES lessons(id) ON DELETE SET NULL,
    title                     TEXT NOT NULL,
    video_url                 TEXT NOT NULL,
    type                      video_type NOT NULL,
    duration_seconds           INTEGER,
    status                    video_status NOT NULL DEFAULT 'scheduled',
    scheduled_at               TIMESTAMPTZ,
    min_attendance_percentage  NUMERIC(5,2) NOT NULL DEFAULT 80.00,
    deleted_at                 TIMESTAMPTZ
);

CREATE TABLE attendance (
    id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id                UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    video_id                  UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    watched_seconds            INTEGER NOT NULL DEFAULT 0,
    watched_percentage         NUMERIC(5,2) NOT NULL DEFAULT 0,
    is_present                 BOOLEAN NOT NULL DEFAULT FALSE,
    last_heartbeat_at          TIMESTAMPTZ,        -- 30s client ping, fraud prevention
    device_session_id          TEXT,               -- locks attendance to one browser instance
    last_updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_attendance_student_video UNIQUE (student_id, video_id)
);


-- =====================================================================
-- 5. POSTS
-- =====================================================================

CREATE TABLE posts (
    id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id                 UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    teacher_id                 UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    content                    TEXT NOT NULL,
    deleted_at                 TIMESTAMPTZ,
    created_at                 TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at                 TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- posts.attachments (Array<String>) -> normalized junction to files
CREATE TABLE post_attachments (
    post_id                   UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    file_id                    UUID NOT NULL REFERENCES files(id) ON DELETE CASCADE,
    order_index                 INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (post_id, file_id)
);


-- =====================================================================
-- 6. QUESTION BANK, QUIZZES & HOMEWORK
-- =====================================================================

-- ---------------------------------------------------------------------
-- questions  (reusable bank)
-- ---------------------------------------------------------------------
CREATE TABLE questions (
    id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id                 UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    type                      question_type NOT NULL,
    text                      TEXT NOT NULL,
    options                   TEXT[],             -- for mcq
    correct_answer             TEXT NOT NULL,
    tags                      TEXT[],
    difficulty                 TEXT,
    deleted_at                 TIMESTAMPTZ
);

-- ---------------------------------------------------------------------
-- quizzes
-- ---------------------------------------------------------------------
CREATE TABLE quizzes (
    id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id                 UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    section_id                 UUID REFERENCES sections(id) ON DELETE SET NULL,   -- NULL for a Proctor mini-quiz
    lesson_id                  UUID REFERENCES lessons(id) ON DELETE SET NULL,
    source_document_id          UUID REFERENCES documents(id) ON DELETE SET NULL, -- NULL if manual
    created_by                  UUID REFERENCES users(id) ON DELETE SET NULL,     -- NULL if AI-generated
    generation_type             quiz_generation_type NOT NULL,
    is_mini_quiz                BOOLEAN NOT NULL DEFAULT FALSE,
    title                       TEXT NOT NULL,
    version                     INTEGER NOT NULL DEFAULT 1,
    deleted_at                  TIMESTAMPTZ
);

-- quizzes.question_ids (Array<ObjectId>) -> junction table
CREATE TABLE quiz_questions (
    quiz_id                   UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    question_id                UUID NOT NULL REFERENCES questions(id) ON DELETE RESTRICT,
    order_index                 INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (quiz_id, question_id)
);

-- ---------------------------------------------------------------------
-- quiz_submissions (+ normalized answers)
-- ---------------------------------------------------------------------
CREATE TABLE quiz_submissions (
    id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id                    UUID NOT NULL REFERENCES quizzes(id) ON DELETE RESTRICT,
    student_id                 UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    score                       NUMERIC(6,2) NOT NULL,
    quiz_version                INTEGER NOT NULL,   -- locks the exact quiz version taken
    deleted_at                  TIMESTAMPTZ,
    submitted_at                 TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- quiz_submissions.answers (Embedded Array) -> normalized table
CREATE TABLE quiz_submission_answers (
    id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id               UUID NOT NULL REFERENCES quiz_submissions(id) ON DELETE CASCADE,
    question_id                  UUID NOT NULL REFERENCES questions(id) ON DELETE RESTRICT,
    selected_answer              TEXT,
    is_correct                   BOOLEAN
);

-- ---------------------------------------------------------------------
-- homework
-- ---------------------------------------------------------------------
CREATE TABLE homework (
    id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id                  UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    section_id                  UUID REFERENCES sections(id) ON DELETE SET NULL,
    lesson_id                   UUID REFERENCES lessons(id) ON DELETE SET NULL,
    teacher_id                  UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    title                       TEXT NOT NULL,
    description                  TEXT,
    due_date                     TIMESTAMPTZ NOT NULL,
    max_grade                    NUMERIC(6,2) NOT NULL,
    pass_threshold                NUMERIC(6,2) NOT NULL,
    lifecycle_status              homework_lifecycle_status NOT NULL DEFAULT 'draft',
    deleted_at                    TIMESTAMPTZ
);

-- ---------------------------------------------------------------------
-- homework_submissions
-- ---------------------------------------------------------------------
CREATE TABLE homework_submissions (
    id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    homework_id                 UUID NOT NULL REFERENCES homework(id) ON DELETE RESTRICT,
    student_id                  UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    file_url                     TEXT NOT NULL,
    grade                        NUMERIC(6,2),
    feedback                     TEXT,
    graded_by                    graded_by_type,
    status                       homework_submission_status NOT NULL DEFAULT 'submitted',
    submitted_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
    graded_at                     TIMESTAMPTZ,
    deleted_at                    TIMESTAMPTZ,
    CONSTRAINT uq_homework_submissions_hw_student UNIQUE (homework_id, student_id)
);

-- now that homework_submissions exists, wire up the deferred FK on enrollments
ALTER TABLE enrollments
    ADD CONSTRAINT fk_enrollments_suspended_by_submission
    FOREIGN KEY (suspended_by_submission_id)
    REFERENCES homework_submissions(id) ON DELETE SET NULL;


-- =====================================================================
-- 7. AI TUTOR / CHAT
-- =====================================================================

CREATE TABLE chat_conversations (
    id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id                  UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    course_id                   UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    status                      chat_conversation_status NOT NULL DEFAULT 'active',
    deleted_at                   TIMESTAMPTZ,
    started_at                   TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_message_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE chat_messages (
    id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id              UUID NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
    sender_type                  chat_sender_type NOT NULL,
    role                         chat_role NOT NULL,
    message_text                 TEXT NOT NULL,
    summary_state                 TEXT,             -- compressed memory snapshot
    moderation_status             moderation_status_type,
    model_name                    TEXT,
    provider                      TEXT,
    temperature                   NUMERIC(3,2),
    prompt_version                 TEXT,
    tokens_used                    INTEGER,
    flagged                        BOOLEAN NOT NULL DEFAULT FALSE,
    flag_reason                    TEXT,
    deleted_at                     TIMESTAMPTZ,
    created_at                     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- chat_messages.source_chunks (Array<{chunk_id, relevance_score, excerpt, vector_id}>)
CREATE TABLE chat_message_source_chunks (
    id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id                   UUID NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
    chunk_id                     UUID NOT NULL REFERENCES document_chunks(id) ON DELETE RESTRICT,
    relevance_score               NUMERIC(5,4),
    excerpt                       TEXT,
    vector_id                     TEXT
);


-- =====================================================================
-- 8. AGENTS, JOBS & AUDIT
-- =====================================================================

CREATE TABLE progress_reports (
    id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id                  UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    course_id                   UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    teacher_id                  UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    flagged_concept              TEXT NOT NULL,
    related_quiz_id              UUID REFERENCES quizzes(id) ON DELETE SET NULL,
    teacher_notified              BOOLEAN NOT NULL DEFAULT FALSE,
    email_sent_at                 TIMESTAMPTZ,
    deleted_at                    TIMESTAMPTZ
);

CREATE TABLE notifications (
    id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type                        notification_type NOT NULL,
    title                       TEXT NOT NULL,
    message                     TEXT NOT NULL,
    related_entity_type          TEXT,            -- polymorphic, no enforced FK by design
    related_entity_id             UUID,
    priority                     notification_priority NOT NULL DEFAULT 'normal',
    delivery_status               TEXT,
    scheduled_at                  TIMESTAMPTZ,
    read_at                       TIMESTAMPTZ,
    is_read                       BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at                    TIMESTAMPTZ,
    created_at                    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE agent_logs (
    id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_type                  agent_type NOT NULL,
    course_id                   UUID REFERENCES courses(id) ON DELETE SET NULL,
    target_entity_type           TEXT,            -- polymorphic, no enforced FK by design
    target_entity_id              UUID,
    action                       TEXT NOT NULL,
    status                       agent_log_status NOT NULL,
    tokens_used                   INTEGER,
    error_message                 TEXT,
    executed_at                    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE ai_jobs (
    id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_type                    TEXT NOT NULL,       -- e.g. 'chunk', 'embed', 'generate_quiz'
    status                      ai_job_status NOT NULL DEFAULT 'queued',
    priority                     INTEGER NOT NULL DEFAULT 0,
    retries                      INTEGER NOT NULL DEFAULT 0,
    target_entity_type            TEXT,            -- polymorphic, no enforced FK by design
    target_entity_id               UUID NOT NULL,
    started_at                     TIMESTAMPTZ,
    finished_at                    TIMESTAMPTZ,
    error_message                  TEXT,
    created_at                     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE activity_logs (
    id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                     UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    action                      TEXT NOT NULL,
    entity_type                  TEXT NOT NULL,     -- polymorphic, no enforced FK by design
    entity_id                     UUID NOT NULL,
    metadata                      JSONB,
    "timestamp"                    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE student_events (
    id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id                  UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    course_id                   UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    event_type                   student_event_type NOT NULL,
    reason                       TEXT,
    metadata                     JSONB,
    created_at                    TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- =====================================================================
-- 9. PROGRESS TRACKING, CERTIFICATES & REVIEWS
-- =====================================================================

-- content_progress: polymorphic item reference modeled as exclusive
-- nullable FKs + a CHECK constraint (safer than an unenforced
-- item_type/item_id pair since progress records are business-critical).
CREATE TABLE content_progress (
    id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id                  UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    course_id                   UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    item_type                    content_progress_item_type NOT NULL,
    video_id                      UUID REFERENCES videos(id) ON DELETE CASCADE,
    quiz_id                       UUID REFERENCES quizzes(id) ON DELETE CASCADE,
    homework_id                   UUID REFERENCES homework(id) ON DELETE CASCADE,
    lesson_id                     UUID REFERENCES lessons(id) ON DELETE CASCADE,
    status                        content_progress_status NOT NULL DEFAULT 'not_started',
    progress_percentage            NUMERIC(5,2) DEFAULT 0,
    last_video_position             INTEGER,          -- seconds, enables resume
    completed_at                    TIMESTAMPTZ,
    score                            NUMERIC(6,2),
    CONSTRAINT chk_content_progress_single_item CHECK (
        (item_type = 'video'    AND video_id    IS NOT NULL AND quiz_id IS NULL AND homework_id IS NULL AND lesson_id IS NULL) OR
        (item_type = 'quiz'     AND quiz_id     IS NOT NULL AND video_id IS NULL AND homework_id IS NULL AND lesson_id IS NULL) OR
        (item_type = 'homework' AND homework_id IS NOT NULL AND video_id IS NULL AND quiz_id IS NULL AND lesson_id IS NULL) OR
        (item_type = 'lesson'   AND lesson_id   IS NOT NULL AND video_id IS NULL AND quiz_id IS NULL AND homework_id IS NULL)
    ),
    CONSTRAINT uq_content_progress_student_item UNIQUE (student_id, item_type, video_id, quiz_id, homework_id, lesson_id)
);

CREATE TABLE certificates (
    id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id                  UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    course_id                   UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    certificate_number            TEXT NOT NULL UNIQUE,
    issued_at                      TIMESTAMPTZ NOT NULL DEFAULT now(),
    pdf_url                        TEXT
);

CREATE TABLE reviews (
    id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id                  UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    course_id                   UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    rating                       SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment                      TEXT,
    created_at                    TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at                    TIMESTAMPTZ,
    CONSTRAINT uq_reviews_student_course UNIQUE (student_id, course_id)
);


-- =====================================================================
-- 10. INDEXES  (per the project plan's Indexing Strategy)
-- =====================================================================

-- users
CREATE UNIQUE INDEX idx_users_email ON users(email);

-- enrollments
-- (uq_enrollments_student_course already creates a unique index)

-- attendance
-- (uq_attendance_student_video already creates a unique index)
CREATE INDEX idx_attendance_video_student ON attendance(video_id, student_id);

-- homework_submissions
-- (uq_homework_submissions_hw_student already creates a unique index)

-- documents
CREATE INDEX idx_documents_course ON documents(course_id);

-- quiz_submissions
CREATE INDEX idx_quiz_submissions_quiz_student ON quiz_submissions(quiz_id, student_id);

-- notifications
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read);

-- chat_messages
CREATE INDEX idx_chat_messages_conversation_created ON chat_messages(conversation_id, created_at);

-- agent_logs
CREATE INDEX idx_agent_logs_course_executed ON agent_logs(course_id, executed_at DESC);

-- sections / lessons (curriculum rendering)
CREATE INDEX idx_sections_course_order ON sections(course_id, order_index);
CREATE INDEX idx_lessons_section_order ON lessons(section_id, order_index);

-- content-to-curriculum lookups
CREATE INDEX idx_videos_lesson ON videos(lesson_id);
CREATE INDEX idx_quizzes_lesson ON quizzes(lesson_id);
CREATE INDEX idx_homework_lesson ON homework(lesson_id);
CREATE INDEX idx_documents_lesson ON documents(lesson_id);

-- question bank filtering
CREATE INDEX idx_questions_course ON questions(course_id);

-- progress & events
CREATE INDEX idx_content_progress_student_course ON content_progress(student_id, course_id);
CREATE INDEX idx_student_events_student_course_created ON student_events(student_id, course_id, created_at);

-- files dedup
CREATE INDEX idx_files_checksum ON files(checksum);

-- soft-delete-aware partial indexes (common "active rows" queries)
CREATE INDEX idx_courses_active ON courses(id) WHERE deleted_at IS NULL;
CREATE INDEX idx_documents_active ON documents(id) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_active ON users(id) WHERE deleted_at IS NULL;


-- =====================================================================
-- END OF SCHEMA
-- =====================================================================

