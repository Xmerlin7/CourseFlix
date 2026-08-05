import { Test } from '@nestjs/testing';
import { GradingService } from './grading.service';
import type { QuestionEntity } from './entities/question.entity';

describe('GradingService', () => {
  let service: GradingService;

  const questions = [
    { id: 'q1', correctAnswer: 'Newton' },
    { id: 'q2', correctAnswer: 'True' },
    { id: 'q3', correctAnswer: 'Joule' },
    { id: 'q4', correctAnswer: 'False' },
    { id: 'q5', correctAnswer: 'Opposite to motion' },
  ] as QuestionEntity[];

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [GradingService],
    }).compile();
    service = module.get(GradingService);
  });

  it('all correct', () => {
    const r = service.grade(
      questions.map((q) => ({
        questionId: q.id,
        selectedAnswer: q.correctAnswer,
      })),
      questions,
    );
    expect(r.score).toBe(5);
    expect(r.total).toBe(5);
    expect(r.results.every((rr) => rr.isCorrect)).toBe(true);
  });

  it('all wrong', () => {
    const r = service.grade(
      questions.map((q) => ({ questionId: q.id, selectedAnswer: 'wrong' })),
      questions,
    );
    expect(r.score).toBe(0);
    expect(r.total).toBe(5);
    expect(r.results.every((rr) => !rr.isCorrect)).toBe(true);
  });

  it('partial 3/5', () => {
    const r = service.grade(
      [
        { questionId: 'q1', selectedAnswer: 'Newton' },
        { questionId: 'q2', selectedAnswer: 'Wrong' },
        { questionId: 'q3', selectedAnswer: 'Joule' },
        { questionId: 'q4', selectedAnswer: 'Wrong' },
        { questionId: 'q5', selectedAnswer: 'Opposite to motion' },
      ],
      questions,
    );
    expect(r.score).toBe(3);
    expect(r.total).toBe(5);
  });

  it('unknown question id is skipped', () => {
    const r = service.grade(
      [{ questionId: 'nonexistent', selectedAnswer: 'x' }],
      questions,
    );
    expect(r.score).toBe(0);
    expect(r.total).toBe(5);
  });
});
