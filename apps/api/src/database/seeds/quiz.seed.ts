import { DataSource, IsNull } from 'typeorm';
import { CourseEntity } from '../../modules/courses/entities/course.entity';
import { LessonEntity } from '../../modules/courses/entities/lesson.entity';
import { QuestionEntity } from '../../modules/quizzes/entities/question.entity';
import { QuizEntity } from '../../modules/quizzes/entities/quiz.entity';
import { QuizQuestionEntity } from '../../modules/quizzes/entities/quiz-question.entity';
import { QuizSubmissionEntity } from '../../modules/quizzes/entities/quiz-submission.entity';
import { QuizSubmissionAnswerEntity } from '../../modules/quizzes/entities/quiz-submission-answer.entity';
import { EnrollmentEntity } from '../../modules/enrollments/entities/enrollment.entity';
import { COURSE_CONTENT } from './content';

export interface QuizSeedSummary {
  quizzesCreated: number;
  questionsCreated: number;
  submissionsCreated: number;
}

/**
 * Seeds one published quiz per lesson, straight from the same
 * `LessonQuestion[]` bank `seeds/content/` uses for the PDF handout and
 * video transcript — so a student who watches the video, reads the PDF
 * and sits the quiz is tested on exactly what they were taught, not on
 * unrelated filler questions.
 *
 * Also seeds a handful of quiz submissions (correct/incorrect answers,
 * a real score) for enrolled students, so the teacher analytics surface
 * and the student's own "نتائجي" history have real data on day one
 * instead of showing every quiz as never-attempted.
 *
 * Safe to run on every reseed: questions upsert by (courseId, text),
 * quizzes by (lessonId), quiz_questions by the (quizId, questionId)
 * primary key, and submissions only seed once per (quizId, studentId)
 * pair — checked before insert since there's no natural unique index to
 * upsert against.
 */
export async function seedQuizzes(
  dataSource: DataSource,
  { teacherId }: { teacherId: string },
): Promise<QuizSeedSummary> {
  const courseRepository = dataSource.getRepository(CourseEntity);
  const lessonRepository = dataSource.getRepository(LessonEntity);
  const questionRepository = dataSource.getRepository(QuestionEntity);
  const quizRepository = dataSource.getRepository(QuizEntity);
  const quizQuestionRepository = dataSource.getRepository(QuizQuestionEntity);
  const submissionRepository = dataSource.getRepository(QuizSubmissionEntity);
  const answerRepository = dataSource.getRepository(QuizSubmissionAnswerEntity);
  const enrollmentRepository = dataSource.getRepository(EnrollmentEntity);

  let quizzesCreated = 0;
  let questionsCreated = 0;
  let submissionsCreated = 0;

  for (const courseContent of COURSE_CONTENT) {
    const course = await courseRepository.findOne({
      where: { slug: courseContent.slug },
    });
    if (!course) continue;

    const enrolledStudentIds = (
      // `EnrollmentEntity.deletedAt` is a plain column, not a
      // `@DeleteDateColumn` — must be filtered explicitly (see
      // `order.seed.ts`'s docblock for why this matters across resets).
      await enrollmentRepository.find({
        where: { courseId: course.id, deletedAt: IsNull() },
      })
    ).map((enrollment) => enrollment.studentId);

    for (const lessonContent of courseContent.lessons) {
      const lesson = await lessonRepository.findOne({
        where: { courseId: course.id, title: lessonContent.lesson },
      });
      if (!lesson) continue;

      const questionIds: string[] = [];
      for (const questionSpec of lessonContent.questions) {
        let question = await questionRepository.findOne({
          where: { courseId: course.id, text: questionSpec.text },
        });
        if (!question) {
          question = await questionRepository.save(
            questionRepository.create({
              courseId: course.id,
              type: questionSpec.type,
              text: questionSpec.text,
              options: questionSpec.options,
              correctAnswer: questionSpec.correctAnswer,
              difficulty: questionSpec.difficulty,
            }),
          );
          questionsCreated += 1;
        }
        questionIds.push(question.id);
      }

      const quizTitle = `اختبار: ${lessonContent.lesson}`;
      let quiz = await quizRepository.findOne({
        where: { lessonId: lesson.id },
      });

      if (!quiz) {
        const dueAt = new Date();
        dueAt.setUTCDate(dueAt.getUTCDate() + 21);

        quiz = await quizRepository.save(
          quizRepository.create({
            courseId: course.id,
            sectionId: lesson.sectionId,
            lessonId: lesson.id,
            createdBy: teacherId,
            generationType: 'manual',
            title: quizTitle,
            status: 'published',
            dueAt,
            version: 1,
          }),
        );
        quizzesCreated += 1;

        for (const [index, questionId] of questionIds.entries()) {
          await quizQuestionRepository.save(
            quizQuestionRepository.create({
              quizId: quiz.id,
              questionId,
              orderIndex: index,
            }),
          );
        }
      }

      // Submissions: every third enrolled student "sits" the quiz, mixing
      // full and partial scores, so results/analytics have real spread
      // instead of either "nobody attempted" or "everybody got 100%".
      for (const [studentIndex, studentId] of enrolledStudentIds.entries()) {
        if (studentIndex % 3 !== 0) continue;

        const alreadySubmitted = await submissionRepository.findOne({
          where: { quizId: quiz.id, studentId },
        });
        if (alreadySubmitted) continue;

        const questions = lessonContent.questions;
        // Deterministic "miss one" pattern rather than random, so a
        // reseed against a wiped DB always reproduces the same scores.
        const missIndex = (studentIndex / 3) % questions.length;
        let correctCount = 0;

        const submission = await submissionRepository.save(
          submissionRepository.create({
            quizId: quiz.id,
            studentId,
            score: 0,
            quizVersion: quiz.version,
          }),
        );

        for (const [index, questionSpec] of questions.entries()) {
          const isCorrect = index !== missIndex;
          if (isCorrect) correctCount += 1;

          const wrongOption = questionSpec.options.find(
            (option) => option !== questionSpec.correctAnswer,
          );

          await answerRepository.save(
            answerRepository.create({
              submissionId: submission.id,
              questionId: questionIds[index],
              selectedAnswer: isCorrect
                ? questionSpec.correctAnswer
                : (wrongOption ?? questionSpec.correctAnswer),
              isCorrect,
            }),
          );
        }

        const score = (correctCount / questions.length) * 100;
        await submissionRepository.update(submission.id, { score });
        submissionsCreated += 1;
      }
    }
  }

  return { quizzesCreated, questionsCreated, submissionsCreated };
}
