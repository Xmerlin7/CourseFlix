import { DataSource, IsNull } from 'typeorm';
import { LessonEntity } from '../../modules/courses/entities/lesson.entity';
import { CourseEntity } from '../../modules/courses/entities/course.entity';
import { VideoEntity } from '../../modules/lessons/entities/video.entity';
import { findLessonContent } from './content';

/**
 * Seeds one real YouTube video per lesson, sourced from `seeds/content/`.
 *
 * Every video is a real, public, embeddable Arabic physics explanation —
 * verified individually (public + `playable_in_embed` + under five
 * minutes) before being written into the content data, not a placeholder
 * clip. `moderationStatus: 'approved'` matches what `CoursesService
 * .syncLessonVideo` sets for a teacher-entered YouTube URL once the
 * worker's caption-safety check clears it — seeded videos skip the queue
 * and start pre-cleared, the same posture Sprint 2's MDN fixture used.
 *
 * Safe to run on every reseed: upserts by `lessonId`.
 */
export async function seedVideo(dataSource: DataSource): Promise<number> {
  const lessonRepository = dataSource.getRepository(LessonEntity);
  const courseRepository = dataSource.getRepository(CourseEntity);
  const videoRepository = dataSource.getRepository(VideoEntity);

  const lessons = await lessonRepository.find({
    where: { deletedAt: IsNull() },
    order: { courseId: 'ASC', sortOrder: 'ASC' },
  });
  const courses = await courseRepository.find();
  const courseSlugById = new Map(courses.map((course) => [course.id, course.slug]));

  let created = 0;
  let updated = 0;

  for (const lesson of lessons) {
    const courseSlug = courseSlugById.get(lesson.courseId);
    const content = courseSlug
      ? findLessonContent(courseSlug, lesson.title)
      : undefined;

    if (!content) {
      // Every seeded lesson has matching content (enforced by
      // `content/index.ts`'s title join) — this only fires for a lesson
      // a developer added by hand outside the fixture, which this seed
      // has no video for and must leave untouched.
      continue;
    }

    const videoUrl = `https://www.youtube.com/watch?v=${content.videoId}`;
    const existing = await videoRepository.findOne({
      where: { lessonId: lesson.id },
    });

    if (!existing) {
      await videoRepository.save(
        videoRepository.create({
          courseId: lesson.courseId,
          sectionId: lesson.sectionId,
          lessonId: lesson.id,
          title: lesson.title,
          videoUrl,
          type: 'recorded',
          durationSeconds: content.videoDurationSeconds,
          status: 'recorded',
          moderationStatus: 'approved',
        }),
      );
      created += 1;
      continue;
    }

    if (
      existing.videoUrl !== videoUrl ||
      existing.durationSeconds !== content.videoDurationSeconds
    ) {
      existing.videoUrl = videoUrl;
      existing.durationSeconds = content.videoDurationSeconds;
      existing.moderationStatus = 'approved';
      await videoRepository.save(existing);
      updated += 1;
    }
  }

  if (updated > 0) {
    console.log(`    videos:         ${updated} updated to match content`);
  }

  return created;
}
