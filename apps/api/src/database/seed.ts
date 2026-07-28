import AppDataSource from './data-source';
import { seedUsers } from './seeds/user.seed';
import { seedCourse } from './seeds/course.seed';
import { seedEnrollment, seedEnrollments } from './seeds/enrollment.seed';
import { seedDocuments } from './seeds/document.seed';
import { seedNotifications } from './seeds/notification.seed';

/**
 * Central seed runner (`npm run seed` in apps/api). Resets to the same
 * demo fixture every time it's run: two teachers, ten students, seven
 * courses (covering every status and both school stages) with sections and
 * lessons, enrollments fanned across them, document rows in every
 * processing status, and a notification feed per user.
 *
 * Every step upserts, so running it twice in a row produces the same state
 * (sprint2-plan.md §12). Run migrations first (`npm run migration:run`).
 */
async function run(): Promise<void> {
  await AppDataSource.initialize();

  try {
    const { teacher, student, teachers, students } =
      await seedUsers(AppDataSource);

    const { course, section, lessons, courses } = await seedCourse(
      AppDataSource,
      teacher.id,
      teachers.slice(1).map((t) => t.id),
    );

    const enrollment = await seedEnrollment(AppDataSource, {
      studentId: student.id,
      courseId: course.id,
    });

    // Archived courses are excluded: enrolling into one contradicts what
    // "archived" means, and the catalogue seeds one on purpose.
    const enrollableCourseIds = courses
      .filter((candidate) => candidate.status !== 'archived')
      .map((candidate) => candidate.id);

    const enrollmentCount = await seedEnrollments(AppDataSource, {
      studentIds: students.map((s) => s.id),
      courseIds: enrollableCourseIds,
    });

    const documentCount = await seedDocuments(AppDataSource, {
      courseId: course.id,
      teacherId: teacher.id,
    });

    const notificationCount = await seedNotifications(AppDataSource, {
      teacherIds: teachers.map((t) => t.id),
      studentIds: students.map((s) => s.id),
    });

    const lessonTotal = await countRows('lessons');

    console.log('Seed complete:');
    console.log(
      `  teachers:       ${teachers.length} (primary: ${teacher.email})`,
    );
    console.log(
      `  students:       ${students.length} (primary: ${student.email})`,
    );
    console.log(`  courses:        ${courses.length}`);
    console.log(`  lessons:        ${lessonTotal}`);
    console.log(
      `  enrollments:    ${enrollmentCount} new (baseline: ${enrollment.status})`,
    );
    console.log(`  documents:      ${documentCount} new`);
    console.log(`  notifications:  ${notificationCount} new`);
    console.log(`  primary course: ${course.title} (${course.id})`);
    console.log(
      `  primary section: ${section.title} — ${lessons.length} lessons`,
    );
  } finally {
    await AppDataSource.destroy();
  }
}

async function countRows(table: 'lessons'): Promise<number> {
  const result = await AppDataSource.query<Array<{ count: string }>>(
    `SELECT count(*)::text AS count FROM ${table} WHERE deleted_at IS NULL`,
  );
  return Number(result[0]?.count ?? 0);
}

run().catch((error) => {
  console.error('Seed failed:', error);
  process.exitCode = 1;
});
