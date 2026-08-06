import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { QuizEntity } from '../../quizzes/entities/quiz.entity';
import { CourseEntity } from '../../courses/entities/course.entity';
import { QuizzesService } from '../../quizzes/quizzes.service';
import { AdminQuizzesService } from './admin-quizzes.service';

describe('AdminQuizzesService', () => {
  let service: AdminQuizzesService;
  let quizRepository: { find: jest.Mock; findOne: jest.Mock };
  let coursesRepository: { find: jest.Mock; findOne: jest.Mock };
  let quizzesService: {
    getTeacherQuiz: jest.Mock;
    updateQuiz: jest.Mock;
    deleteQuiz: jest.Mock;
  };

  const quizId = 'quiz-1';
  const courseId = 'course-1';
  const teacherId = 'teacher-1';

  beforeEach(async () => {
    quizRepository = { find: jest.fn(), findOne: jest.fn() };
    coursesRepository = { find: jest.fn(), findOne: jest.fn() };
    quizzesService = {
      getTeacherQuiz: jest.fn(),
      updateQuiz: jest.fn(),
      deleteQuiz: jest.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        AdminQuizzesService,
        { provide: getRepositoryToken(QuizEntity), useValue: quizRepository },
        {
          provide: getRepositoryToken(CourseEntity),
          useValue: coursesRepository,
        },
        { provide: QuizzesService, useValue: quizzesService },
      ],
    }).compile();

    service = moduleRef.get(AdminQuizzesService);
  });

  it('resolves the owning teacherId through the quiz->course chain before delegating', async () => {
    quizRepository.findOne.mockResolvedValue({ id: quizId, courseId });
    coursesRepository.findOne.mockResolvedValue({ id: courseId, teacherId });
    quizzesService.getTeacherQuiz.mockResolvedValue({ id: quizId });

    await service.getQuizDetail(quizId);

    expect(quizzesService.getTeacherQuiz).toHaveBeenCalledWith(
      quizId,
      teacherId,
    );
  });

  it('throws NotFoundException when the quiz does not exist', async () => {
    quizRepository.findOne.mockResolvedValue(null);
    await expect(service.getQuizDetail('missing')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('throws NotFoundException when the quiz has no matching course', async () => {
    quizRepository.findOne.mockResolvedValue({ id: quizId, courseId });
    coursesRepository.findOne.mockResolvedValue(null);
    await expect(service.deleteQuiz(quizId)).rejects.toThrow(NotFoundException);
  });
});
