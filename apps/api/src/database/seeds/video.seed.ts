import { DataSource, IsNull } from 'typeorm';
import { LessonEntity } from '../../modules/courses/entities/lesson.entity';
import { VideoEntity } from '../../modules/lessons/entities/video.entity';

interface VideoSource {
  url: string;
  durationSeconds: number;
}

/**
 * CC0 clips hosted by MDN (`interactive-examples.mdn.mozilla.net`) — real,
 * browser-playable, CORS-enabled (`Access-Control-Allow-Origin: *`) MP4s.
 * `durationSeconds` was measured directly with `ffprobe` against the
 * actually-served file, not copied from a listing — reverify the same way
 * if MDN ever changes the encode.
 *
 * An earlier version of this file used Google's
 * `storage.googleapis.com/gtv-videos-bucket/sample/*` URLs (the commonly
 * quoted Big Buck Bunny/Sintel/etc. test set). That bucket now returns
 * `403 AccessDenied` for anonymous requests — caught during manual
 * browser verification of the lesson player (CF-US-007), not in a unit
 * test, since no test in this slice actually fetches the video byte
 * stream. These MDN clips are a few seconds long rather than full films;
 * that is a feature for this fixture, not a shortcoming — it makes the
 * attendance threshold and completion state reachable in a manual QA
 * pass in seconds instead of minutes.
 */
export const VIDEO_SOURCES: VideoSource[] = [
  {
    url: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
    durationSeconds: 5,
  },
  {
    url: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/friday.mp4',
    durationSeconds: 6,
  },
  {
    url: 'https://interactive-examples.mdn.mozilla.net/media/examples/stream-of-water.mp4',
    durationSeconds: 3,
  },
];

/**
 * Seeds one `recorded` video per seeded lesson, across every course — not
 * just the primary one — so every lesson in the catalogue is playable
 * (sprint2-plan.md §A-1).
 *
 * Safe to run on every reseed: upserts by `lessonId`.
 */
export async function seedVideo(dataSource: DataSource): Promise<number> {
  const lessonRepository = dataSource.getRepository(LessonEntity);
  const videoRepository = dataSource.getRepository(VideoEntity);

  const lessons = await lessonRepository.find({
    where: { deletedAt: IsNull() },
    order: { courseId: 'ASC', sortOrder: 'ASC' },
  });

  let created = 0;

  for (const [index, lesson] of lessons.entries()) {
    const existing = await videoRepository.findOne({
      where: { lessonId: lesson.id },
    });
    if (existing) {
      continue;
    }

    const source = VIDEO_SOURCES[index % VIDEO_SOURCES.length];

    await videoRepository.save(
      videoRepository.create({
        courseId: lesson.courseId,
        sectionId: lesson.sectionId,
        lessonId: lesson.id,
        title: lesson.title,
        videoUrl: source.url,
        type: 'recorded',
        durationSeconds: source.durationSeconds,
        status: 'recorded',
      }),
    );
    created += 1;
  }

  return created;
}
