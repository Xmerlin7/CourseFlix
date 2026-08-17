import { DataSource } from 'typeorm';
import {
  CourseEntity,
  CourseStatus,
} from '../../modules/courses/entities/course.entity';
import { SectionEntity } from '../../modules/courses/entities/section.entity';
import { LessonEntity } from '../../modules/courses/entities/lesson.entity';
import { findCourseContent } from './content';

export interface SeededCourse {
  /** The primary demo course — a named field because the rest of the
   *  fixture (enrollments, documents) anchors to it. */
  course: CourseEntity;
  section: SectionEntity;
  lessons: LessonEntity[];
  /** Every seeded course, primary one first. */
  courses: CourseEntity[];
}

interface CourseBlueprint {
  slug: string;
  title: string;
  description: string;
  gradeLevel: string;
  status: CourseStatus;
  sections: Array<{ title: string; lessons: string[] }>;
}

// Exported so `reset-check.ts` can locate the exact same anchor rows
// (primary course, primary section) without duplicating fixture data.
export const COURSE_BLUEPRINTS: CourseBlueprint[] = [
  {
    slug: 'classical-mechanics',
    title: 'الميكانيكا الكلاسيكية',
    description: 'مقدمة في قوانين نيوتن للحركة والتطبيقات العملية عليها.',
    gradeLevel: 'الصف الأول الثانوي',
    status: 'published',
    sections: [
      {
        title: 'قوانين نيوتن للحركة',
        lessons: [
          'القانون الأول لنيوتن: القصور الذاتي',
          'القانون الثاني لنيوتن: القوة والتسارع',
          'القانون الثالث لنيوتن: الفعل ورد الفعل',
        ],
      },
      {
        title: 'الشغل والطاقة',
        lessons: [
          'مفهوم الشغل والقدرة',
          'طاقة الوضع وطاقة الحركة',
          'قانون حفظ الطاقة الميكانيكية',
          'تطبيقات على الآلات البسيطة',
        ],
      },
      {
        title: 'كمية الحركة والتصادمات',
        lessons: [
          'الدفع وكمية الحركة',
          'التصادمات المرنة وغير المرنة',
          'قانون حفظ كمية الحركة',
        ],
      },
    ],
  },
  {
    slug: 'electromagnetism',
    title: 'الكهرومغناطيسية',
    description: 'المجالات الكهربية والمغناطيسية والحث الكهرومغناطيسي.',
    gradeLevel: 'الصف الثالث الثانوي',
    status: 'published',
    sections: [
      {
        title: 'المجال الكهربي',
        lessons: [
          'قانون كولوم',
          'شدة المجال الكهربي',
          'الجهد الكهربي وفرق الجهد',
          'المكثفات وسعتها',
        ],
      },
      {
        title: 'التيار الكهربي',
        lessons: [
          'قانون أوم',
          'المقاومة النوعية',
          'توصيل المقاومات',
          'قانونا كيرشوف',
        ],
      },
      {
        title: 'المغناطيسية والحث',
        lessons: [
          'المجال المغناطيسي الناشئ عن تيار',
          'القوة المغناطيسية على موصل',
          'قانون فاراداي للحث',
        ],
      },
    ],
  },
  {
    slug: 'waves-and-optics',
    title: 'الموجات والضوء',
    description: 'الحركة الموجية، الصوت، وانكسار وانعكاس الضوء.',
    gradeLevel: 'الصف الثاني الثانوي',
    status: 'published',
    sections: [
      {
        title: 'الحركة الموجية',
        lessons: [
          'خصائص الموجات',
          'الموجات المستعرضة والطولية',
          'التداخل والحيود',
        ],
      },
      {
        title: 'الضوء',
        lessons: [
          'انعكاس الضوء والمرايا',
          'انكسار الضوء والعدسات',
          'الانعكاس الكلي والألياف الضوئية',
          'تحليل الضوء والطيف',
        ],
      },
    ],
  },
  {
    slug: 'thermodynamics',
    title: 'الديناميكا الحرارية',
    description: 'الحرارة ودرجة الحرارة وقوانين الديناميكا الحرارية.',
    gradeLevel: 'الصف الثاني الثانوي',
    status: 'draft',
    sections: [
      {
        title: 'الحرارة ودرجة الحرارة',
        lessons: ['التمدد الحراري', 'السعة الحرارية', 'انتقال الحرارة'],
      },
    ],
  },
  {
    slug: 'modern-physics',
    title: 'الفيزياء الحديثة',
    description: 'النظرية النسبية وميكانيكا الكم وفيزياء الجسيمات.',
    gradeLevel: 'الصف الثالث الثانوي',
    status: 'published',
    sections: [
      {
        title: 'النظرية النسبية',
        lessons: [
          'مبادئ النسبية الخاصة',
          'تمدد الزمن وتقلص الطول',
          'تكافؤ الكتلة والطاقة',
        ],
      },
      {
        title: 'ميكانيكا الكم',
        lessons: [
          'الظاهرة الكهروضوئية',
          'نموذج بور للذرة',
          'ازدواجية الموجة والجسيم',
        ],
      },
    ],
  },
  {
    slug: 'prep-science-basics',
    title: 'أساسيات العلوم للإعدادية',
    description: 'تأسيس في مفاهيم الفيزياء الأساسية لطلاب المرحلة الإعدادية.',
    gradeLevel: 'الصف الثالث الإعدادي',
    status: 'published',
    sections: [
      {
        title: 'المادة وخواصها',
        lessons: ['حالات المادة', 'الكثافة', 'الضغط'],
      },
      { title: 'الحركة', lessons: ['السرعة والتسارع', 'الرسم البياني للحركة'] },
    ],
  },
  {
    slug: 'archived-astronomy',
    title: 'مقدمة في علم الفلك',
    description: 'دورة قديمة تمت أرشفتها ولم تعد متاحة للتسجيل.',
    gradeLevel: 'الصف الأول الثانوي',
    status: 'archived',
    sections: [
      {
        title: 'المجموعة الشمسية',
        lessons: ['الكواكب الداخلية', 'الكواكب الخارجية'],
      },
    ],
  },
];

/**
 * Seeds the full demo catalogue: seven courses, covering every course
 * status (published / draft / archived) and both school stages, each
 * with real Arabic physics sections and lessons, all owned by the one
 * platform teacher.
 *
 * Safe to run on every reseed: upserts by slug (course) and by title
 * within its parent (section, lesson) instead of inserting duplicates.
 */
export async function seedCourse(
  dataSource: DataSource,
  teacherId: string,
): Promise<SeededCourse> {
  const courseRepository = dataSource.getRepository(CourseEntity);
  const sectionRepository = dataSource.getRepository(SectionEntity);
  const lessonRepository = dataSource.getRepository(LessonEntity);

  const courses: CourseEntity[] = [];
  let primarySection: SectionEntity | undefined;
  let primaryLessons: LessonEntity[] = [];

  for (const [blueprintIndex, blueprint] of COURSE_BLUEPRINTS.entries()) {
    // A real, reachable Wikimedia Commons photo per course — chosen to
    // match the subject (Newton's cradle for mechanics, a prism for
    // optics, the solar system for astronomy) so `CourseThumb.tsx` never
    // falls back to the placeholder for a seeded course.
    const coverImageUrl = findCourseContent(blueprint.slug)?.coverImageUrl ?? null;

    let course = await courseRepository.findOne({
      where: { slug: blueprint.slug },
    });
    if (!course) {
      course = await courseRepository.save(
        courseRepository.create({
          teacherId,
          title: blueprint.title,
          slug: blueprint.slug,
          description: blueprint.description,
          coverImageUrl,
          gradeLevel: blueprint.gradeLevel,
          status: blueprint.status,
        }),
      );
    } else if (course.coverImageUrl !== coverImageUrl) {
      // Backfill for any course seeded before cover images existed.
      course.coverImageUrl = coverImageUrl;
      course = await courseRepository.save(course);
    }
    courses.push(course);

    for (const [
      sectionIndex,
      sectionBlueprint,
    ] of blueprint.sections.entries()) {
      let section = await sectionRepository.findOne({
        where: { courseId: course.id, title: sectionBlueprint.title },
      });
      if (!section) {
        section = await sectionRepository.save(
          sectionRepository.create({
            courseId: course.id,
            title: sectionBlueprint.title,
            sortOrder: sectionIndex + 1,
            status: 'published',
          }),
        );
      }

      const lessons: LessonEntity[] = [];
      for (const [lessonIndex, title] of sectionBlueprint.lessons.entries()) {
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
              sortOrder: lessonIndex + 1,
              status: 'published',
            }),
          );
        }
        lessons.push(lesson);
      }

      if (blueprintIndex === 0 && sectionIndex === 0) {
        primarySection = section;
        primaryLessons = lessons;
      }
    }
  }

  if (!primarySection) {
    throw new Error('Course seed failed to produce the primary section.');
  }

  return {
    course: courses[0],
    section: primarySection,
    lessons: primaryLessons,
    courses,
  };
}
