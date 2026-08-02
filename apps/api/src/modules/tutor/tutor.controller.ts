import { Body, Controller, HttpCode, HttpStatus, Param, Post, UseGuards } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthGuard } from '../auth/guards/auth.guard';
import { StudentRoleGuard } from '../auth/guards/student-role.guard';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { SendTutorMessageDto } from './dto/send-tutor-message.dto';
import { TutorService } from './tutor.service';

@Controller('api/v1')
@UseGuards(AuthGuard, StudentRoleGuard, ThrottlerGuard)
export class TutorController {
  constructor(private readonly tutorService: TutorService) {}

  @Post('courses/:courseId/tutor/messages')
  @HttpCode(HttpStatus.OK)
  sendMessage(
    @Param('courseId') courseId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: SendTutorMessageDto,
  ) {
    return this.tutorService.sendMessage({
      courseId,
      studentId: user.id,
      message: dto.message,
    });
  }
}
