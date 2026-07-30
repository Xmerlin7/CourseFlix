import { Injectable } from '@nestjs/common';
import { QuestionEntity } from './entities/question.entity';

interface GradeInput {
  questionId: string;
  selectedAnswer: string;
}

interface GradeResult {
  questionId: string;
  isCorrect: boolean;
}

interface GradeOutput {
  score: number;
  total: number;
  results: GradeResult[];
}

@Injectable()
export class GradingService {
  grade(answers: GradeInput[], questions: QuestionEntity[]): GradeOutput {
    const questionMap = new Map(questions.map((q) => [q.id, q]));
    let score = 0;
    const results: GradeResult[] = [];

    for (const answer of answers) {
      const question = questionMap.get(answer.questionId);
      if (!question) continue;
      const isCorrect = question.correctAnswer === answer.selectedAnswer;
      if (isCorrect) score++;
      results.push({ questionId: answer.questionId, isCorrect });
    }

    return { score, total: questions.length, results };
  }
}
