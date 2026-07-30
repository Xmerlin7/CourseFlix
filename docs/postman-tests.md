# Postman Test Data — CourseFlix API

Base URL: `http://localhost:4000/api/v1`

---

## Auth

### POST /api/v1/auth/register — Register student

```json
// Body
{
  "fullName": "Ahmed Student",
  "email": "ahmed@test.com",
  "password": "TestPass123"
}
// Expected: 201
// Response: { "user": { "id": "...", "email": "ahmed@test.com", "fullName": "Ahmed Student", "role": "student", "avatarUrl": null } }
// Sets cookie: courseflix.sid
```

### POST /api/v1/auth/register — Duplicate email → 409

```json
{
  "fullName": "Second User",
  "email": "ahmed@test.com",
  "password": "TestPass456"
}
// Expected: 409
```

### POST /api/v1/auth/register — Role injection → 400

```json
{
  "fullName": "Hacker",
  "email": "hacker@test.com",
  "password": "HackPass123",
  "role": "teacher"
}
// Expected: 400 (property role should not exist)
```

### POST /api/v1/auth/register — Weak password → 400

```json
{
  "fullName": "Weak",
  "email": "weak@test.com",
  "password": "123"
}
// Expected: 400
```

### POST /api/v1/auth/login — Login

```json
{
  "email": "ahmed@test.com",
  "password": "TestPass123"
}
// Expected: 200
// Response: { "user": { "id": "...", "email": "ahmed@test.com", "fullName": "Ahmed Student", "role": "student" } }
// Sets cookie: courseflix.sid
```

### POST /api/v1/auth/logout — Logout

```
// No body
// Expected: 200
// Clears cookie
```

### GET /api/v1/me — Current user

```
// Cookie required
// Expected: 200
// Response: { "id": "...", "email": "ahmed@test.com", "role": "student", "fullName": "Ahmed Student", "avatarUrl": null }
```

---

## Health

### GET /api/v1/health

```
// No auth
// Expected: 200
// Response: { "status": "ok", "timestamp": "...", "database": "connected" }
```

---

## Teacher — Dashboard & Courses

All teacher endpoints require `AuthGuard` + `TeacherRoleGuard` (cookie with teacher session).

### GET /api/v1/teacher/dashboard

```
// Expected: 200
// Response: { "teacher": { "id": "..." }, "stats": { "ownedCourseCount": 0, "publishedCourseCount": 0, "enrolledStudentCount": 0 }, "recentCourses": [] }
```

### GET /api/v1/teacher/courses

```
// Query: ?status=draft | published | archived (optional)
// Expected: 200
// Response: [{ "id": "...", "title": "...", "description": "...", "coverImageUrl": "...", "gradeLevel": "...", "status": "draft" }]
```

### POST /api/v1/teacher/courses — Create course

```json
{
  "title": "Classical Mechanics",
  "description": "An introduction to classical mechanics",
  "gradeLevel": "Grade 10"
}
// Expected: 201
// Response: { "id": "...", "title": "Classical Mechanics", "description": "...", "coverImageUrl": null, "gradeLevel": "Grade 10", "status": "draft" }
```

### PATCH /api/v1/teacher/courses/:courseId — Update course

```json
{
  "title": "Classical Mechanics (Updated)",
  "status": "published"
}
// Expected: 200
```

### DELETE /api/v1/teacher/courses/:courseId — Delete course

```
// Expected: 204
```

---

## Teacher — Sections

### GET /api/v1/teacher/sections/:sectionId

```
// Expected: 200
// Response: { "id": "...", "courseId": "...", "title": "...", "sortOrder": 1, "status": "published" }
```

### POST /api/v1/teacher/courses/:courseId/sections — Create section

```json
{
  "title": "Chapter 1: Kinematics"
}
// Expected: 201
// Response: { "id": "...", "courseId": "...", "title": "Chapter 1: Kinematics", "sortOrder": 1, "status": "published" }
```

### PATCH /api/v1/teacher/sections/:sectionId — Update section

```json
{
  "title": "Chapter 1: Motion",
  "status": "draft"
}
// Expected: 200
```

### DELETE /api/v1/teacher/sections/:sectionId — Delete section

```
// Expected: 204
```

### PATCH /api/v1/teacher/courses/:courseId/sections/reorder — Reorder sections

```json
{
  "items": [
    { "id": "<section-uuid-2>", "sortOrder": 1 },
    { "id": "<section-uuid-1>", "sortOrder": 2 }
  ]
}
// Expected: 200
```

---

## Teacher — Lessons

### GET /api/v1/teacher/lessons/:lessonId

```
// Expected: 200
// Response: { "id": "...", "sectionId": "...", "courseId": "...", "title": "...", "videoUrl": null, "sortOrder": 1, "status": "published" }
```

### POST /api/v1/teacher/sections/:sectionId/lessons — Create lesson

```json
{
  "title": "Introduction to Vectors",
  "videoUrl": "https://example.com/vectors.mp4"
}
// Expected: 201
// Response: { "id": "...", "sectionId": "...", "courseId": "...", "title": "Introduction to Vectors", "videoUrl": "https://example.com/vectors.mp4", "sortOrder": 1, "status": "published" }
```

### PATCH /api/v1/teacher/lessons/:lessonId — Update lesson

```json
{
  "title": "Introduction to Vectors (Updated)",
  "status": "draft"
}
// Expected: 200
```

### DELETE /api/v1/teacher/lessons/:lessonId — Delete lesson

```
// Expected: 204
```

### PATCH /api/v1/teacher/sections/:sectionId/lessons/reorder — Reorder lessons

```json
{
  "items": [
    { "id": "<lesson-uuid-2>", "sortOrder": 1 },
    { "id": "<lesson-uuid-1>", "sortOrder": 2 }
  ]
}
// Expected: 200
```

---

## Course Detail (Shared)

### GET /api/v1/courses/:courseId

```
// AuthGuard required (teacher or student)
// Teacher: must own the course
// Student: must be enrolled
// Expected: 200
// Response: { "id": "...", "title": "...", "slug": "...", "description": "...", "coverImageUrl": "...", "gradeLevel": "...", "status": "published", "teacher": { "id": "...", "fullName": "..." }, "canEdit": true, "sections": [{ "id": "...", "title": "...", "sortOrder": 1, "lessons": [] }] }
```

---

## Student — Enrollments

All student endpoints require `AuthGuard` + `StudentRoleGuard`.

### POST /api/v1/student/enroll — Self-enroll

```json
{
  "courseId": "<course-uuid>"
}
// Expected: 201
// Response: { "id": "...", "courseId": "...", "courseTitle": "...", "gradeLevel": "...", "status": "active" }
```

### POST /api/v1/student/enroll — Already enrolled → 409

```json
{
  "courseId": "<course-uuid>"
}
// Expected: 409
```

### POST /api/v1/student/enroll — Course not found → 404

```json
{
  "courseId": "00000000-0000-0000-0000-000000000000"
}
// Expected: 404
```

### POST /api/v1/student/enroll — Draft course → 403

```json
{
  "courseId": "<draft-course-uuid>"
}
// Expected: 403
```

### POST /api/v1/student/enroll — Archived course → 403

```json
{
  "courseId": "<archived-course-uuid>"
}
// Expected: 403
```

### POST /api/v1/student/enroll — Own course → 403

```
// Teacher attempts to enroll in own course as student
// Expected: 403
```

### GET /api/v1/student/enrollments

```
// Query: ?status=active | suspended | completed (optional)
// Expected: 200
// Response: [{ "id": "...", "courseId": "...", "courseTitle": "...", "gradeLevel": "...", "status": "active" }]
```

### GET /api/v1/student/enrollments/:enrollmentId

```
// Expected: 200
```

### PATCH /api/v1/student/enrollments/:enrollmentId — Update status

```json
{
  "status": "completed"
}
// Expected: 200
```

### DELETE /api/v1/student/enrollments/:enrollmentId — Unenroll

```
// Expected: 204
```

### GET /api/v1/student/dashboard

```
// Expected: 200
// Response: { "student": { "id": "...", "fullName": "...", "email": "...", "avatarUrl": null }, "stats": { "enrolledCoursesCount": 1, "activeCoursesCount": 1 }, "overallProgressPercent": null, "continueLearning": null, "recentCourses": [...] }
```

---

## Quizzes — Student

### GET /api/v1/quizzes/:quizId — Get quiz (no correctAnswer)

```
// Expected: 200
// Response: { "id": "...", "title": "...", "questions": [{ "id": "...", "type": "mcq", "text": "...", "options": [...] }], "submission": null }
```

### POST /api/v1/quizzes/:quizId/submissions — Submit quiz

```json
{
  "answers": [
    { "questionId": "<q1-uuid>", "selectedAnswer": "Newton" },
    { "questionId": "<q2-uuid>", "selectedAnswer": "False" }
  ]
}
// Expected: 201
// Response: { "submissionId": "...", "score": 2, "total": 2, "answers": [{ "questionId": "...", "isCorrect": true }] }
```

### POST /api/v1/quizzes/:quizId/submissions — Duplicate → 409

```json
{
  "answers": [
    { "questionId": "<q1-uuid>", "selectedAnswer": "Newton" }
  ]
}
// Expected: 409
```

### GET /api/v1/lessons/:lessonId/quizzes — Lesson quizzes

```
// Expected: 200
// Response: [{ "id": "...", "title": "...", "questionCount": 2, "submission": { "score": 2, "total": 2 } }]
```

### GET /api/v1/sections/:sectionId/quizzes — Section quizzes

```
// Expected: 200
// Response: same shape as lesson quizzes
```

---

## Quizzes — Teacher

All teacher quiz endpoints require `AuthGuard` + `TeacherRoleGuard`.

### POST /api/v1/teacher/quizzes — Create quiz

```json
{
  "courseId": "<course-uuid>",
  "lessonId": "<lesson-uuid>",
  "title": "Physics Quiz 1",
  "questions": [
    { "type": "mcq", "text": "What is the unit of force?", "options": ["Newton", "Joule", "Watt"], "correctAnswer": "Newton" },
    { "type": "true_false", "text": "Mass and weight are the same thing", "options": ["True", "False"], "correctAnswer": "False" }
  ]
}
// Expected: 201
// Response includes questions WITH correctAnswer
```

### GET /api/v1/teacher/quizzes/:quizId — View quiz (with correctAnswer)

```
// Expected: 200
// Response: { "id": "...", "title": "...", "version": 1, "questions": [{ "id": "...", "type": "mcq", "text": "...", "options": [...], "correctAnswer": "..." }] }
```

### GET /api/v1/teacher/courses/:courseId/quizzes — List course quizzes

```
// Expected: 200
// Response: [{ "id": "...", "title": "...", "version": 1, "questions": [...] }]
```

### PATCH /api/v1/teacher/quizzes/:quizId — Update quiz

```json
{
  "title": "Physics Quiz 1 (Updated)"
}
// Expected: 200, version incremented
```

### PATCH /api/v1/teacher/quizzes/:quizId — Update after submission → 409

```json
{
  "title": "Should fail"
}
// Expected: 409
```

### DELETE /api/v1/teacher/quizzes/:quizId — Delete quiz

```
// Expected: 204
```

---

## Documents — Teacher

All document endpoints require `AuthGuard` + `TeacherRoleGuard`.

### POST /api/v1/teacher/courses/:courseId/documents — Upload document

```
// Form-data: file (PDF)
// Expected: 201
```

### GET /api/v1/teacher/courses/:courseId/documents — List documents

```
// Expected: 200
```

### POST /api/v1/teacher/documents/:documentId/retry — Retry processing

```
// Expected: 200
```

---

## Notifications

All notification endpoints require `AuthGuard`.

### GET /api/v1/notifications

```
// Expected: 200
```

### GET /api/v1/notifications/unread-count

```
// Expected: 200
```

### PATCH /api/v1/notifications/:notificationId/read

```
// Expected: 200
```

---

## Seeded Data Flow (Recommended Test Order)

1. **Register** a teacher → `POST /api/v1/auth/register` (set `fullName`, `email`, `password`)
2. **Create course** → `POST /api/v1/teacher/courses`
3. **Create section** → `POST /api/v1/teacher/courses/:courseId/sections`
4. **Create lesson** → `POST /api/v1/teacher/sections/:sectionId/lessons`
5. **Publish course** → `PATCH /api/v1/teacher/courses/:courseId` with `{ "status": "published" }`
6. **Register a student** → `POST /api/v1/auth/register` (separate account)
7. **Student enrolls** → `POST /api/v1/student/enroll`
8. **Create quiz** → `POST /api/v1/teacher/quizzes`
9. **Student views quiz** → `GET /api/v1/quizzes/:quizId`
10. **Student submits** → `POST /api/v1/quizzes/:quizId/submissions`
