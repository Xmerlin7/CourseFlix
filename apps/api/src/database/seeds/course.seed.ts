import { DataSource } from 'typeorm';
import {
  CourseEntity,
  CourseStatus,
} from '../../modules/courses/entities/course.entity';
import { SectionEntity } from '../../modules/courses/entities/section.entity';
import { LessonEntity } from '../../modules/courses/entities/lesson.entity';

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
  /** Index into the resolved teacher list. */
  teacher: number;
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
    teacher: 0,
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
    teacher: 0,
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
    teacher: 0,
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
    teacher: 0,
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
    teacher: 1,
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
    teacher: 1,
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
    teacher: 1,
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
 * with real Arabic physics sections and lessons. `extraTeacherIds` is
 * only for pre-single-teacher fixtures/tests — the live seed runner
 * passes none, so every course falls back to the one primary teacher.
 *
 * Safe to run on every reseed: upserts by slug (course) and by title
 * within its parent (section, lesson) instead of inserting duplicates.
 */
export async function seedCourse(
  dataSource: DataSource,
  teacherId: string,
  extraTeacherIds: string[] = [],
): Promise<SeededCourse> {
  const courseRepository = dataSource.getRepository(CourseEntity);
  const sectionRepository = dataSource.getRepository(SectionEntity);
  const lessonRepository = dataSource.getRepository(LessonEntity);

  const teacherIds = [teacherId, ...extraTeacherIds];
  const courses: CourseEntity[] = [];
  let primarySection: SectionEntity | undefined;
  let primaryLessons: LessonEntity[] = [];

  for (const [blueprintIndex, blueprint] of COURSE_BLUEPRINTS.entries()) {
    // Falls back to the primary teacher when no extras were supplied, so
    // the fixture still seeds cleanly for single-teacher callers.
    const ownerId = teacherIds[blueprint.teacher] ?? teacherId;

    let course = await courseRepository.findOne({
      where: { slug: blueprint.slug },
    });
    if (!course) {
      course = await courseRepository.save(
        courseRepository.create({
          teacherId: ownerId,
          title: blueprint.title,
          slug: blueprint.slug,
          description: blueprint.description,
          coverImageUrl: null,
          gradeLevel: blueprint.gradeLevel,
          status: blueprint.status,
        }),
      );
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
