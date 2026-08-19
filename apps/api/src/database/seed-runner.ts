import { DataSource } from 'typeorm';
import { seedUsers } from './seeds/user.seed';
import { seedTeacherQuota } from './seeds/teacher-quota.seed';
import { seedCourse } from './seeds/course.seed';
import { seedEnrollment, seedEnrollments } from './seeds/enrollment.seed';
import { seedContentProgress } from './seeds/content-progress.seed';
import { seedDocuments } from './seeds/document.seed';
import { seedCourseHandouts } from './seeds/course-handout.seed';
import { seedQuizzes } from './seeds/quiz.seed';
import { seedAnnouncements } from './seeds/announcement.seed';
import { seedDiscussions } from './seeds/discussion.seed';
import { seedSupportTickets } from './seeds/support.seed';
import { seedChatHistory } from './seeds/chat.seed';
import { seedAgentLogs } from './seeds/agent-log.seed';
import { seedAssistantActions } from './seeds/assistant-action.seed';
import { seedOrders } from './seeds/order.seed';
import { seedIntervention } from './seeds/intervention.seed';
import { seedNotifications } from './seeds/notification.seed';
import { seedVideo } from './seeds/video.seed';
import { seedVideoTranscripts } from './seeds/video-transcript.seed';
import { reEmbedDocumentChunks } from './re-embed-chunks';
import { clearTransactionalDemoState } from './seeds/transactional-reset.seed';

export interface SeedSummary {
  primaryTeacherEmail: string;
  assistantCount: number;
  quotaCredits: number;
  primaryAssistantEmail: string;
  studentCount: number;
  primaryStudentEmail: string;
  courseCount: number;
  lessonTotal: number;
  videosCreated: number;
  enrollmentsCreated: number;
  primaryEnrollmentStatus: string;
  contentProgressCreated: number;
  documentsCreated: number;
  documentsReset: number;
  handoutsCreated: number;
  handoutsUpdated: number;
  quizzesCreated: number;
  questionsCreated: number;
  quizSubmissionsCreated: number;
  announcementsCreated: number;
  discussionThreadsCreated: number;
  discussionRepliesCreated: number;
  supportTicketsCreated: number;
  supportMessagesCreated: number;
  chatConversationsCreated: number;
  agentLogsCreated: number;
  assistantActionsCreated: number;
  ordersCreated: number;
  paymentsCreated: number;
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

  const { teacher, assistant, assistants, student, students } =
    await seedUsers(dataSource);

  const quota = await seedTeacherQuota(dataSource, teacher.id);

  const { course, section, lessons, courses } = await seedCourse(
    dataSource,
    teacher.id,
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

  const { created: documentsCreated, reset: documentsReset } =
    await seedDocuments(dataSource, {
      courseId: course.id,
      teacherId: teacher.id,
    });

  const { created: handoutsCreated, updated: handoutsUpdated } =
    await seedCourseHandouts(dataSource, { teacherId: teacher.id });

  const {
    quizzesCreated,
    questionsCreated,
    submissionsCreated: quizSubmissionsCreated,
  } = await seedQuizzes(dataSource, { teacherId: teacher.id });

  const announcementsCreated = await seedAnnouncements(dataSource, {
    teacherId: teacher.id,
  });

  const studentIds = students.map((s) => s.id);
  const assistantIds = assistants.map((a) => a.id);

  const {
    threadsCreated: discussionThreadsCreated,
    repliesCreated: discussionRepliesCreated,
  } = await seedDiscussions(dataSource, { teacherId: teacher.id, studentIds });

  const {
    ticketsCreated: supportTicketsCreated,
    messagesCreated: supportMessagesCreated,
  } = await seedSupportTickets(dataSource, {
    teacherId: teacher.id,
    studentIds,
  });

  const agentLogsCreated = await seedAgentLogs(dataSource);

  const assistantActionsCreated = await seedAssistantActions(dataSource, {
    teacherId: teacher.id,
    assistantIds,
  });

  const { ordersCreated, paymentsCreated } = await seedOrders(dataSource, {
    studentIds,
  });

  // Runs after `seedOrders` (not right after `seedVideo`, where a lesson's
  // video row first becomes available) so it also covers the enrollments
  // *that same seed run's* paid orders just created — otherwise a
  // checkout-created enrollment would wait a whole extra `npm run seed`
  // cycle before its lessons show any progress. See the seed's own
  // docblock for why a `'completed'` enrollment alone doesn't already
  // unlock a course's lessons in the player.
  const contentProgressCreated = await seedContentProgress(dataSource);

  // Runs last among the content-writing steps, after every seed above
  // that can add/change `document_chunks` (`seedDocuments`,
  // `seedCourseHandouts`), so a single `npm run seed` leaves every active
  // chunk embedded in Chroma — not just whatever was already there from a
  // *previous* run. Video transcripts embed themselves inline in
  // `seedVideoTranscripts`, so this only needs to cover document chunks.
  await reEmbedDocumentChunks();

  // Needs the handout's document_chunks to exist (queries them for real
  // citation ids), so it runs after `seedCourseHandouts` — but not after
  // `reEmbedDocumentChunks`, since it only reads the Postgres chunk rows,
  // not their Chroma vectors.
  const { conversationsCreated: chatConversationsCreated } =
    await seedChatHistory(dataSource);

  const intervention = await seedIntervention(dataSource);

  // Last of all: every notification looks up a real anchor row (thread,
  // ticket, quiz, post, assistant action, intervention) created by one of
  // the seeds above, so it must run after all of them.
  const notificationsCreated = await seedNotifications(dataSource, {
    teacherIds: [teacher.id],
    assistantIds,
    studentIds,
  });

  const lessonTotal = await countRows(dataSource, 'lessons');

  return {
    primaryTeacherEmail: teacher.email,
    assistantCount: assistants.length,
    quotaCredits: quota.totalCredits,
    primaryAssistantEmail: assistant.email,
    studentCount: students.length,
    primaryStudentEmail: student.email,
    courseCount: courses.length,
    lessonTotal,
    videosCreated,
    enrollmentsCreated,
    primaryEnrollmentStatus: enrollment.status,
    contentProgressCreated,
    documentsCreated,
    documentsReset,
    handoutsCreated,
    handoutsUpdated,
    quizzesCreated,
    questionsCreated,
    quizSubmissionsCreated,
    announcementsCreated,
    discussionThreadsCreated,
    discussionRepliesCreated,
    supportTicketsCreated,
    supportMessagesCreated,
    chatConversationsCreated,
    agentLogsCreated,
    assistantActionsCreated,
    ordersCreated,
    paymentsCreated,
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
  console.log(`  teacher:        ${summary.primaryTeacherEmail}`);
  console.log(
    `  assistants:     ${summary.assistantCount} (primary: ${summary.primaryAssistantEmail})`,
  );
  console.log(`  teacher quota:  ${summary.quotaCredits} AI credits`);
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
    `  content progress: ${summary.contentProgressCreated} new (lesson unlock state)`,
  );
  console.log(
    `  documents:      ${summary.documentsCreated} new, ${summary.documentsReset} reset to blueprint`,
  );
  console.log(
    `  handouts:       ${summary.handoutsCreated} new course PDF(s), ${summary.handoutsUpdated} regenerated`,
  );
  console.log(
    `  quizzes:        ${summary.quizzesCreated} new, ${summary.questionsCreated} question(s), ${summary.quizSubmissionsCreated} submission(s)`,
  );
  console.log(`  announcements:  ${summary.announcementsCreated} new`);
  console.log(
    `  discussions:    ${summary.discussionThreadsCreated} thread(s), ${summary.discussionRepliesCreated} reply(ies)`,
  );
  console.log(
    `  support:        ${summary.supportTicketsCreated} ticket(s), ${summary.supportMessagesCreated} message(s)`,
  );
  console.log(
    `  tutor chats:    ${summary.chatConversationsCreated} conversation(s)`,
  );
  console.log(`  agent logs:     ${summary.agentLogsCreated} new`);
  console.log(`  assistant reqs: ${summary.assistantActionsCreated} new`);
  console.log(
    `  orders:         ${summary.ordersCreated} new, ${summary.paymentsCreated} payment(s)`,
  );
  console.log(`  notifications:  ${summary.notificationsCreated} new`);
  console.log(
    `  interventions:  demo intervention + mini quiz ready (${summary.interventionMiniQuizId ?? 'none'})`,
  );
  console.log(
    `  checkout state: ${summary.ordersCleared} order(s) cleared, ${summary.enrollmentsClearedFromCheckout} checkout-enrollment(s) reverted`,
  );
  console.log(`  agent logs cleared: ${summary.agentLogsCleared} row(s)`);
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
