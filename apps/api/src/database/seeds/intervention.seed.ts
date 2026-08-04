import { DataSource } from 'typeorm';
import { CourseEntity } from '../../modules/courses/entities/course.entity';
import { InterventionMiniQuizQuestionEntity } from '../../modules/interventions/entities/intervention-mini-quiz-question.entity';
import { InterventionMiniQuizEntity } from '../../modules/interventions/entities/intervention-mini-quiz.entity';
import { InterventionEntity } from '../../modules/interventions/entities/intervention.entity';
import { UserEntity } from '../../modules/users/entities/user.entity';

const FALLBACK_QUESTIONS: Array<{
  text: string;
  type: 'mcq' | 'true_false';
  options: string[];
  correctAnswer: string;
}> = [
  {
    text: 'ما هو القانون الأساسي المتعلق بهذه المفاهيم؟',
    type: 'mcq',
    options: ['قانون أول', 'قانون ثاني', 'قانون ثالث', 'لا شيء مما سبق'],
    correctAnswer: 'قانون أول',
  },
  {
    text: 'هل هذه المفاهيم مترابطة في الفيزياء؟',
    type: 'true_false',
    options: ['صح', 'خطأ'],
    correctAnswer: 'صح',
  },
  {
    text: 'أي من التالي يمثل تطبيقاً عملياً لهذه المفاهيم؟',
    type: 'mcq',
    options: [
      'الحركة اليومية',
      'السكون التام',
      'الانحلال الذري',
      'الانبعاث الضوئي',
    ],
    correctAnswer: 'الحركة اليومية',
  },
];

/**
 * Deterministic demo intervention for the primary student on the primary
 * course, with a linked mini-quiz (3 questions). Idempotent upsert: looks
 * the intervention up by dedup_key, so re-running the seed never creates
 * a second row.
 */
export async function seedIntervention(dataSource: DataSource): Promise<{
  interventionId: string;
  miniQuizId: string | null;
}> {
  const interventionRepository = dataSource.getRepository(InterventionEntity);
  const miniQuizRepository = dataSource.getRepository(
    InterventionMiniQuizEntity,
  );
  const questionRepository = dataSource.getRepository(
    InterventionMiniQuizQuestionEntity,
  );

  const student = await dataSource.getRepository(UserEntity).findOneByOrFail({
    email: process.env.SEED_STUDENT_EMAIL ?? 'student@courseflix.local',
  });
  const course = await dataSource
    .getRepository(CourseEntity)
    .createQueryBuilder('c')
    .where('c.status = :status', { status: 'published' })
    .orderBy('c.created_at', 'ASC')
    .getOneOrFail();

  const dedupKey = `${student.id}:${course.id}:low_quiz_score:${course.title.toLowerCase()}`;

  const existing = await interventionRepository.findOne({
    where: { dedupKey },
  });

  if (existing) {
    return { interventionId: existing.id, miniQuizId: existing.miniQuizId };
  }

  const intervention = await interventionRepository.save(
    interventionRepository.create({
      studentId: student.id,
      courseId: course.id,
      teacherId: course.teacherId,
      ruleKey: 'low_quiz_score',
      ruleVersion: 1,
      weakConcept: course.title,
      status: 'active',
      dedupKey,
    }),
  );

  const miniQuiz = await miniQuizRepository.save(
    miniQuizRepository.create({
      interventionId: intervention.id,
      courseId: course.id,
      studentId: student.id,
      weakConcept: course.title,
      status: 'active',
    }),
  );

  await questionRepository.save(
    FALLBACK_QUESTIONS.map((q, i) =>
      questionRepository.create({
        miniQuizId: miniQuiz.id,
        text: q.text,
        type: q.type,
        options: q.options,
        correctAnswer: q.correctAnswer,
        orderIndex: i,
      }),
    ),
  );

  await interventionRepository.update(intervention.id, {
    miniQuizId: miniQuiz.id,
  });

  return { interventionId: intervention.id, miniQuizId: miniQuiz.id };
}
