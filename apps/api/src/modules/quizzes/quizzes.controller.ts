import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { scopeTeacherId } from '../../common/utils/scope-teacher-id';
import { AuthGuard } from '../auth/guards/auth.guard';
import { StudentRoleGuard } from '../auth/guards/student-role.guard';
import { TeacherRoleGuard } from '../auth/guards/teacher-role.guard';
import { TeacherOrAssistantRoleGuard } from '../auth/guards/teacher-or-assistant-role.guard';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { SubmitQuizDto } from './dto/submit-quiz.dto';
import { UpdateQuizDto } from './dto/update-quiz.dto';
import {
  QuizzesService,
  StudentQuizResponse,
  TeacherQuizResponse,
  QuizSummary,
} from './quizzes.service';

@Controller('api/v1')
export class QuizzesController {
  constructor(private readonly quizzesService: QuizzesService) {}

  @Get('quizzes/:quizId')
  @UseGuards(AuthGuard, StudentRoleGuard)
  async getQuiz(
    @Param('quizId') quizId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<StudentQuizResponse> {
    return this.quizzesService.getQuiz(quizId, user.id);
  }

  @Post('quizzes/:quizId/submissions')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(AuthGuard, StudentRoleGuard)
  async submitQuiz(
    @Param('quizId') quizId: string,
    @Body() dto: SubmitQuizDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.quizzesService.submitQuiz(quizId, user.id, dto);
  }

  @Get('lessons/:lessonId/quizzes')
  @UseGuards(AuthGuard, StudentRoleGuard)
  async getLessonQuizzes(
    @Param('lessonId') lessonId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<QuizSummary[]> {
    return this.quizzesService.getLessonQuizzes(lessonId, user.id);
  }

  @Get('sections/:sectionId/quizzes')
  @UseGuards(AuthGuard, StudentRoleGuard)
  async getSectionQuizzes(
    @Param('sectionId') sectionId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<QuizSummary[]> {
    return this.quizzesService.getSectionQuizzes(sectionId, user.id);
  }

  @Get('courses/:courseId/quizzes')
  @UseGuards(AuthGuard, StudentRoleGuard)
  async getCourseQuizzes(
    @Param('courseId') courseId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<QuizSummary[]> {
    return this.quizzesService.getCourseQuizzes(courseId, user.id);
  }

  @Post('teacher/quizzes')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(AuthGuard, TeacherOrAssistantRoleGuard)
  async createQuiz(
    @Body() dto: CreateQuizDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<TeacherQuizResponse> {
    return this.quizzesService.createQuiz(scopeTeacherId(user), dto);
  }

  @Get('teacher/quizzes/:quizId')
  @UseGuards(AuthGuard, TeacherOrAssistantRoleGuard)
  async getTeacherQuiz(
    @Param('quizId') quizId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<TeacherQuizResponse> {
    return this.quizzesService.getTeacherQuiz(quizId, scopeTeacherId(user));
  }

  @Get('teacher/courses/:courseId/quizzes')
  @UseGuards(AuthGuard, TeacherOrAssistantRoleGuard)
  async listCourseQuizzes(
    @Param('courseId') courseId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<TeacherQuizResponse[]> {
    return this.quizzesService.listCourseQuizzes(courseId, scopeTeacherId(user));
  }

  @Patch('teacher/quizzes/:quizId')
  @UseGuards(AuthGuard, TeacherOrAssistantRoleGuard)
  async updateQuiz(
    @Param('quizId') quizId: string,
    @Body() dto: UpdateQuizDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<TeacherQuizResponse> {
    return this.quizzesService.updateQuiz(quizId, scopeTeacherId(user), dto);
  }

  @Delete('teacher/quizzes/:quizId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(AuthGuard, TeacherOrAssistantRoleGuard)
  async deleteQuiz(
    @Param('quizId') quizId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    await this.quizzesService.deleteQuiz(quizId, scopeTeacherId(user));
  }
}
