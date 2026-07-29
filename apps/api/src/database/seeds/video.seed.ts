import { DataSource, IsNull } from 'typeorm';
import { LessonEntity } from '../../modules/courses/entities/lesson.entity';
import { VideoEntity } from '../../modules/lessons/entities/video.entity';

interface VideoSource {
  url: string;
  durationSeconds: number;
}

/**
 * Public-domain Blender Foundation short films hosted on Google's
 * `gtv-videos-bucket` sample set — real, browser-playable, CORS-enabled
 * MP4s with documented runtimes. Cycled across lessons (by index) instead
 * of repeating one clip everywhere, so the demo shows some variety.
 * Durations are each film's official runtime; reverify against the
 * actually-served file if the bucket ever changes its encode.
 */
const VIDEO_SOURCES: VideoSource[] = [
  {
    url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    durationSeconds: 596,
  },
  {
    url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    durationSeconds: 654,
  },
  {
    url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
    durationSeconds: 888,
  },
  {
    url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    durationSeconds: 734,
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
