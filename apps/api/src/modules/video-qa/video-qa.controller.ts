import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { SkipThrottle, Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthGuard } from '../auth/guards/auth.guard';
import { StudentRoleGuard } from '../auth/guards/student-role.guard';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { AskVideoQuestionDto } from './dto/ask-video-question.dto';
import { VideoQaService } from './video-qa.service';

@Controller('api/v1/student/videos')
@UseGuards(AuthGuard, StudentRoleGuard, ThrottlerGuard)
export class VideoQaController {
  constructor(private readonly videoQaService: VideoQaService) {}

  // Cheap read, polled every few seconds by the frontend while a
  // transcript is processing (see useVideoQaStatus) — the controller-level
  // ThrottlerGuard was reusing LOGIN_RATE_LIMIT's 5-per-15-minutes budget,
  // meant for brute-force login protection, which this polling burned
  // through in well under a minute. A 429 here was silently rendered by
  // the frontend as "assistant not available for this video", masking
  // the real cause. No abuse cost to this route, so it's exempt outright.
  @Get(':videoId/qa-status')
  @SkipThrottle()
  getStatus(
    @Param('videoId') videoId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.videoQaService.getStatus({ videoId, studentId: user.id });
  }

  // Same misconfiguration as above, but this route does have a real cost
  // (an LLM call) — given its own limit instead of inheriting login's,
  // generous enough for an actual back-and-forth Q&A session.
  @Post(':videoId/ask')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 20, ttl: 5 * 60 * 1000 } })
  ask(
    @Param('videoId') videoId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: AskVideoQuestionDto,
  ) {
    return this.videoQaService.ask({
      videoId,
      studentId: user.id,
      question: dto.question,
    });
  }
}
