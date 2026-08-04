import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthGuard } from '../auth/guards/auth.guard';
import { StudentRoleGuard } from '../auth/guards/student-role.guard';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { SubmitMiniQuizDto } from './dto/submit-mini-quiz.dto';
import { MiniQuizService } from './mini-quiz.service';

@Controller('api/v1/student/mini-quizzes')
@UseGuards(AuthGuard, StudentRoleGuard)
export class MiniQuizController {
  constructor(private readonly miniQuizService: MiniQuizService) {}

  @Get(':miniQuizId')
  getMiniQuiz(
    @Param('miniQuizId') miniQuizId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.miniQuizService.getForStudent(miniQuizId, user.id);
  }

  @Post(':miniQuizId/submit')
  submitMiniQuiz(
    @Param('miniQuizId') miniQuizId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: SubmitMiniQuizDto,
  ) {
    return this.miniQuizService.submit(miniQuizId, user.id, dto);
  }
}
