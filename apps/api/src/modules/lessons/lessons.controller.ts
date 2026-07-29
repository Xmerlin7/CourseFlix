import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthGuard } from '../auth/guards/auth.guard';
import { StudentRoleGuard } from '../auth/guards/student-role.guard';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { UpdateProgressDto } from './dto/update-progress.dto';
import { LessonsService } from './lessons.service';

@Controller('api/v1')
@UseGuards(AuthGuard, StudentRoleGuard)
export class LessonsController {
  constructor(private readonly lessonsService: LessonsService) {}

  @Get('lessons/:lessonId')
  getLesson(
    @Param('lessonId') lessonId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.lessonsService.getLessonDetail(lessonId, user.id);
  }

  @Post('lessons/:lessonId/progress')
  updateProgress(
    @Param('lessonId') lessonId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateProgressDto,
  ) {
    return this.lessonsService.updateProgress(lessonId, user.id, dto);
  }
}
