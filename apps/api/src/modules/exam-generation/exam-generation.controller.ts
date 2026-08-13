import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { scopeTeacherId } from '../../common/utils/scope-teacher-id';
import { AuthGuard } from '../auth/guards/auth.guard';
import { TeacherOrAssistantRoleGuard } from '../auth/guards/teacher-or-assistant-role.guard';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { CreateExamGenerationRequestDto } from './dto/create-exam-generation-request.dto';
import { ExamGenerationFeedbackDto } from './dto/exam-generation-feedback.dto';
import { ExamGenerationService } from './exam-generation.service';

@Controller('api/v1')
@UseGuards(AuthGuard, TeacherOrAssistantRoleGuard)
export class ExamGenerationController {
  constructor(private readonly examGenerationService: ExamGenerationService) {}

  @Post('teacher/exam-generation-requests')
  @HttpCode(HttpStatus.CREATED)
  createRequest(
    @Body() dto: CreateExamGenerationRequestDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.examGenerationService.createRequest(scopeTeacherId(user), dto);
  }

  @Get('teacher/courses/:courseId/exam-generation-requests')
  listForCourse(
    @Param('courseId') courseId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.examGenerationService.listForCourse(courseId, scopeTeacherId(user));
  }

  @Get('teacher/exam-generation-requests/:requestId')
  getRequest(
    @Param('requestId') requestId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.examGenerationService.getRequest(requestId, scopeTeacherId(user));
  }

  @Post('teacher/exam-generation-requests/:requestId/accept')
  accept(
    @Param('requestId') requestId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.examGenerationService.accept(requestId, scopeTeacherId(user));
  }

  @Post('teacher/exam-generation-requests/:requestId/reject')
  reject(
    @Param('requestId') requestId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.examGenerationService.reject(requestId, scopeTeacherId(user));
  }

  @Post('teacher/exam-generation-requests/:requestId/feedback')
  submitFeedback(
    @Param('requestId') requestId: string,
    @Body() dto: ExamGenerationFeedbackDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.examGenerationService.submitFeedback(
      requestId,
      scopeTeacherId(user),
      dto.message,
    );
  }
}
