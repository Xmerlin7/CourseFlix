import { DataSource } from 'typeorm';
import { seedUsers } from './seeds/user.seed';
import { seedCourse } from './seeds/course.seed';
import { seedEnrollment, seedEnrollments } from './seeds/enrollment.seed';
import { seedDocuments } from './seeds/document.seed';
import { seedIntervention } from './seeds/intervention.seed';
import { seedNotifications } from './seeds/notification.seed';
import { seedVideo } from './seeds/video.seed';
import { seedVideoTranscripts } from './seeds/video-transcript.seed';
import { reEmbedDocumentChunks } from './re-embed-chunks';
import { clearTransactionalDemoState } from './seeds/transactional-reset.seed';

export interface SeedSummary {
  teacherCount: number;
  primaryTeacherEmail: string;
  assistantEmail: string;
  studentCount: number;
  primaryStudentEmail: string;
  courseCount: number;
  lessonTotal: number;
  videosCreated: number;
  enrollmentsCreated: number;
  primaryEnrollmentStatus: string;
  documentsCreated: number;
  documentsReset: number;
  notificationsCreated: number;
  interventionMiniQuizId: string | null;
  enrollmentsClearedFromCheckout: number;
  ordersCleared: number;
  agentLogsCleared: number;
  primaryCourseTitle: string;
  primaryCourseId: string;
  primarySectionTitle: string;
  primarySectionLessonCount: number;
}

export interface RunSeedOptions {
  resetTransactionalState?: boolean;
}

export async function runSeed(
  dataSource: DataSource,
  options: RunSeedOptions = {},
): Promise<SeedSummary> {
  const transactionalReset = options.resetTransactionalState
    ? await clearTransactionalDemoState(dataSource)
    : {
        enrollmentsClearedFromCheckout: 0,
        ordersCleared: 0,
        agentLogsCleared: 0,
      };

  const { teacher, assistant, student, teachers, students } =
    await seedUsers(dataSource);

  const { course, section, lessons, courses } = await seedCourse(
    dataSource,
    teacher.id,
    teachers.slice(1).map((t) => t.id),
  );

  const enrollment = await seedEnrollment(dataSource, {
    studentId: student.id,
    courseId: course.id,
  });

  const enrollableCourseIds = courses
    .filter((candidate) => candidate.status !== 'archived')
    .map((candidate) => candidate.id);

  const enrollmentsCreated = await seedEnrollments(dataSource, {
    studentIds: students.map((s) => s.id),
    courseIds: enrollableCourseIds,
  });

  const videosCreated = await seedVideo(dataSource);

  await seedVideoTranscripts(dataSource);
  await reEmbedDocumentChunks();

  const { created: documentsCreated, reset: documentsReset } =
    await seedDocuments(dataSource, {
      courseId: course.id,
      teacherId: teacher.id,
    });

  const notificationsCreated = await seedNotifications(dataSource, {
    teacherIds: teachers.map((t) => t.id),
    studentIds: students.map((s) => s.id),
  });

  const intervention = await seedIntervention(dataSource);

  const lessonTotal = await countRows(dataSource, 'lessons');

  return {
    teacherCount: teachers.length,
    primaryTeacherEmail: teacher.email,
    assistantEmail: assistant.email,
    studentCount: students.length,
    primaryStudentEmail: student.email,
    courseCount: courses.length,
    lessonTotal,
    videosCreated,
    enrollmentsCreated,
    primaryEnrollmentStatus: enrollment.status,
    documentsCreated,
    documentsReset,
    notificationsCreated,
    interventionMiniQuizId: intervention.miniQuizId,
    primaryCourseTitle: course.title,
    primaryCourseId: course.id,
    primarySectionTitle: section.title,
    primarySectionLessonCount: lessons.length,
    enrollmentsClearedFromCheckout:
      transactionalReset.enrollmentsClearedFromCheckout,
    ordersCleared: transactionalReset.ordersCleared,
    agentLogsCleared: transactionalReset.agentLogsCleared,
  };
}

/** Shared console formatting so `seed.ts` and `reset.ts` print identically, modulo heading. */
export function printSeedSummary(summary: SeedSummary, heading: string): void {
  console.log(heading);
  console.log(
    `  teachers:       ${summary.teacherCount} (primary: ${summary.primaryTeacherEmail})`,
  );
  console.log(`  assistants:     1 (${summary.assistantEmail})`);
  console.log(
    `  students:       ${summary.studentCount} (primary: ${summary.primaryStudentEmail})`,
  );
  console.log(`  courses:        ${summary.courseCount}`);
  console.log(`  lessons:        ${summary.lessonTotal}`);
  console.log(`  videos:         ${summary.videosCreated} new`);
  console.log(
    `  enrollments:    ${summary.enrollmentsCreated} new (baseline: ${summary.primaryEnrollmentStatus})`,
  );
  console.log(
    `  documents:      ${summary.documentsCreated} new, ${summary.documentsReset} reset to blueprint`,
  );
  console.log(`  notifications:  ${summary.notificationsCreated} new`);
  console.log(
    `  interventions:  demo intervention + mini quiz ready (${summary.interventionMiniQuizId ?? 'none'})`,
  );
  console.log(
    `  checkout state: ${summary.ordersCleared} order(s) cleared, ${summary.enrollmentsClearedFromCheckout} checkout-enrollment(s) reverted`,
  );
  console.log(`  agent logs:     ${summary.agentLogsCleared} row(s) cleared`);
  console.log(
    `  primary course: ${summary.primaryCourseTitle} (${summary.primaryCourseId})`,
  );
  console.log(
    `  primary section: ${summary.primarySectionTitle} — ${summary.primarySectionLessonCount} lessons`,
  );
}

export async function countRows(
  dataSource: DataSource,
  table: 'lessons',
): Promise<number> {
  const result = await dataSource.query<Array<{ count: string }>>(
    `SELECT count(*)::text AS count FROM ${table} WHERE deleted_at IS NULL`,
  );
  return Number(result[0]?.count ?? 0);
}
