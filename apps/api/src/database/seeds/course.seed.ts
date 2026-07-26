import { DataSource } from 'typeorm';
import { CourseEntity } from '../../modules/courses/entities/course.entity';
import { SectionEntity } from '../../modules/courses/entities/section.entity';
import { LessonEntity } from '../../modules/courses/entities/lesson.entity';

export interface SeededCourse {
  course: CourseEntity;
  section: SectionEntity;
  lessons: LessonEntity[];
}

const COURSE_SLUG = 'classical-mechanics';

/**
 * Seeds the one published, owned course the Sprint 1 fixture needs, with
 * one section and three ordered lessons (see sprint1-plan.md "Shared
 * Team Task: DB and Seeds"). Safe to run on every reseed: upserts by
 * slug/title instead of inserting duplicates.
 */
export async function seedCourse(
  dataSource: DataSource,
  teacherId: string,
): Promise<SeededCourse> {
  const courseRepository = dataSource.getRepository(CourseEntity);
  const sectionRepository = dataSource.getRepository(SectionEntity);
  const lessonRepository = dataSource.getRepository(LessonEntity);

  let course = await courseRepository.findOne({ where: { slug: COURSE_SLUG } });
  if (!course) {
    course = await courseRepository.save(
      courseRepository.create({
        teacherId,
        title: 'الميكانيكا الكلاسيكية',
        slug: COURSE_SLUG,
        description: 'مقدمة في قوانين نيوتن للحركة والتطبيقات العملية عليها.',
        coverImageUrl: null,
        gradeLevel: 'الصف الأول الثانوي',
        status: 'published',
      }),
    );
  }

  let section = await sectionRepository.findOne({
    where: { courseId: course.id, title: 'قوانين نيوتن للحركة' },
  });
  if (!section) {
    section = await sectionRepository.save(
      sectionRepository.create({
        courseId: course.id,
        title: 'قوانين نيوتن للحركة',
        sortOrder: 1,
        status: 'published',
      }),
    );
  }

  const lessonTitles = [
    'القانون الأول لنيوتن: القصور الذاتي',
    'القانون الثاني لنيوتن: القوة والتسارع',
    'القانون الثالث لنيوتن: الفعل ورد الفعل',
  ];

  const lessons: LessonEntity[] = [];
  for (const [index, title] of lessonTitles.entries()) {
    let lesson = await lessonRepository.findOne({
      where: { sectionId: section.id, title },
    });
    if (!lesson) {
      lesson = await lessonRepository.save(
        lessonRepository.create({
          sectionId: section.id,
          courseId: course.id,
          title,
          videoUrl: null,
          sortOrder: index + 1,
          status: 'published',
        }),
      );
    }
    lessons.push(lesson);
  }

  return { course, section, lessons };
}
