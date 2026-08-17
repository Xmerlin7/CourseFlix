import { DataSource, IsNull } from 'typeorm';
import { EnrollmentEntity } from '../../modules/enrollments/entities/enrollment.entity';
import { LessonEntity } from '../../modules/courses/entities/lesson.entity';
import { VideoEntity } from '../../modules/lessons/entities/video.entity';
import { ContentProgressEntity } from '../../modules/lessons/entities/content-progress.entity';

/**
 * Seeds `content_progress` rows so a course's lessons actually show as
 * unlocked in the student player — without this, `content_progress` was
 * never seeded at all, so `StudentLessonPage`'s sequential-unlock logic
 * (`unlockedLessonIds`, keyed off `progress.status === 'completed'`) saw
 * every lesson after the first as locked, even for an enrollment whose own
 * `status` is `'completed'`. Enrollment status and per-lesson progress are
 * two different things — a `'completed'` enrollment describes the
 * *outcome*, not a per-lesson `content_progress` row, so the seed has to
 * write both.
 *
 * - `completed` enrollments: every lesson's video gets a `completed`,
 *   100% row, so the whole course opens unlocked end to end.
 * - `active` enrollments: the first half of the lessons get `completed`
 *   rows and the next one gets `in_progress` at 45%, so the course looks
 *   like a real student is partway through it — unlocked so far, locked
 *   beyond that — instead of either fully locked or fully done.
 * - `suspended` enrollments are left untouched (no progress to show).
 *
 * Safe to run on every reseed: upserts by (studentId, videoId).
 */
export async function seedContentProgress(
  dataSource: DataSource,
): Promise<number> {
  const enrollmentRepository = dataSource.getRepository(EnrollmentEntity);
  const lessonRepository = dataSource.getRepository(LessonEntity);
  const videoRepository = dataSource.getRepository(VideoEntity);
  const progressRepository = dataSource.getRepository(ContentProgressEntity);

  const enrollments = await enrollmentRepository.find({
    where: { deletedAt: IsNull() },
  });

  let created = 0;

  for (const enrollment of enrollments) {
    if (enrollment.status === 'suspended') continue;

    const lessons = await lessonRepository.find({
      where: { courseId: enrollment.courseId, deletedAt: IsNull() },
      order: { sortOrder: 'ASC' },
    });
    if (lessons.length === 0) continue;

    const completeThrough =
      enrollment.status === 'completed'
        ? lessons.length
        : Math.max(1, Math.floor(lessons.length / 2));
    // One extra lesson sits `in_progress` right after the completed run,
    // for `active` enrollments only — a `completed` enrollment has
    // nothing left to be "in progress" on.
    const inProgressIndex =
      enrollment.status === 'active' && completeThrough < lessons.length
        ? completeThrough
        : -1;

    for (const [index, lesson] of lessons.entries()) {
      const video = await videoRepository.findOne({
        where: { lessonId: lesson.id, deletedAt: IsNull() },
      });
      if (!video) continue;

      const isCompleted = index < completeThrough;
      const isInProgress = index === inProgressIndex;
      if (!isCompleted && !isInProgress) continue;

      const existing = await progressRepository.findOne({
        where: {
          studentId: enrollment.studentId,
          videoId: video.id,
          itemType: 'video',
        },
      });
      if (existing) continue;

      const duration = video.durationSeconds ?? 0;
      const percentage = isCompleted ? 100 : 45;
      const watchedSeconds = Math.floor((duration * percentage) / 100);

      await progressRepository.save(
        progressRepository.create({
          studentId: enrollment.studentId,
          courseId: enrollment.courseId,
          itemType: 'video',
          videoId: video.id,
          lessonId: lesson.id,
          status: isCompleted ? 'completed' : 'in_progress',
          progressPercentage: percentage.toFixed(2),
          lastVideoPosition: watchedSeconds,
          completedAt: isCompleted ? new Date() : null,
        }),
      );
      created += 1;
    }
  }

  return created;
}
