import AppDataSource from './data-source';
import { seedUsers } from './seeds/user.seed';
import { seedCourse } from './seeds/course.seed';
import { seedEnrollment } from './seeds/enrollment.seed';

/**
 * Central seed runner (`npm run seed` in apps/api). Resets to the same
 * Sprint 1 fixture every time it's run: one teacher, one student, one
 * published owned course with one section and three lessons, and one
 * active enrollment linking the student to the course. Run migrations
 * first (`npm run migration:run`).
 */
async function run(): Promise<void> {
  await AppDataSource.initialize();

  try {
    const { teacher, student } = await seedUsers(AppDataSource);
    const { course, section, lessons } = await seedCourse(
      AppDataSource,
      teacher.id,
    );
    const enrollment = await seedEnrollment(AppDataSource, {
      studentId: student.id,
      courseId: course.id,
    });

    console.log('Seed complete:');
    console.log(`  teacher:    ${teacher.email} (${teacher.id})`);
    console.log(`  student:    ${student.email} (${student.id})`);
    console.log(`  course:     ${course.title} (${course.id})`);
    console.log(`  section:    ${section.title} (${section.id})`);
    console.log(`  lessons:    ${lessons.length}`);
    console.log(`  enrollment: ${enrollment.id} (${enrollment.status})`);
  } finally {
    await AppDataSource.destroy();
  }
}

run().catch((error) => {
  console.error('Seed failed:', error);
  process.exitCode = 1;
});
