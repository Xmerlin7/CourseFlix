import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthGuard } from '../auth/guards/auth.guard';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { CreateReplyDto } from './dto/create-reply.dto';
import {
  DiscussionListFilters,
  DiscussionStatusFilter,
  DiscussionsService,
} from './discussions.service';

type UploadedAttachment = {
  originalname: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
};

const VALID_STATUS_FILTERS: readonly DiscussionStatusFilter[] = [
  'all',
  'answered',
  'unanswered',
  'mine',
];

/**
 * A discussion thread is reachable by both a student (if enrolled) and
 * the course's teacher/assistants (if they own the course) — access is
 * resolved per-request in the service rather than split across two
 * role-guarded controllers, since the read/write shape is identical for
 * both audiences and splitting it would just duplicate every method.
 * `AuthGuard` still gates "must be logged in"; `DiscussionsService`
 * gates "must have a real relationship to this course".
 */
@Controller('api/v1')
@UseGuards(AuthGuard)
export class DiscussionsController {
  constructor(private readonly discussionsService: DiscussionsService) {}

  @Get('courses/:courseId/discussions')
  listThreads(
    @Param('courseId') courseId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('tag') tag?: string,
  ) {
    const filters: DiscussionListFilters = {
      status: VALID_STATUS_FILTERS.includes(status as DiscussionStatusFilter)
        ? (status as DiscussionStatusFilter)
        : 'all',
      search: search?.trim() || undefined,
      tag: tag?.trim() || undefined,
    };
    return this.discussionsService.listThreads(courseId, user, filters);
  }

function decodeOriginalName(filename: string | undefined): string {
  if (!filename) return '';
  try {
    const decoded = Buffer.from(filename, 'latin1').toString('utf8');
    if (/[\u0600-\u06FF]/.test(decoded)) {
      return decoded;
    }
  } catch {
    // fallback
  }
  return filename;
}

  @Post('courses/:courseId/discussions')
  @UseInterceptors(FileInterceptor('attachment'))
  createThread(
    @Param('courseId') courseId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body('title') title: string,
    @Body('body') body: string,
    @Body('tags') tagsJson: string | undefined,
    @UploadedFile() attachment?: UploadedAttachment,
  ) {
    return this.discussionsService.createThread(courseId, user, {
      title: title ?? '',
      body: body ?? '',
      tags: this.parseTags(tagsJson),
      attachment: attachment
        ? {
            buffer: attachment.buffer,
            originalName: decodeOriginalName(attachment.originalname),
            mimeType: attachment.mimetype,
            sizeBytes: attachment.size,
          }
        : undefined,
    });
  }

  @Get('discussions/:threadId')
  getThread(
    @Param('threadId') threadId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.discussionsService.getThread(threadId, user);
  }

  @Post('discussions/:threadId/replies')
  createReply(
    @Param('threadId') threadId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateReplyDto,
  ) {
    return this.discussionsService.createReply(threadId, user, dto);
  }

  @Post('discussions/:threadId/accept/:replyId')
  acceptAnswer(
    @Param('threadId') threadId: string,
    @Param('replyId') replyId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.discussionsService.acceptAnswer(threadId, replyId, user);
  }

  @Delete('discussions/:threadId/accept')
  unacceptAnswer(
    @Param('threadId') threadId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.discussionsService.unacceptAnswer(threadId, user);
  }

  @Post('discussions/:threadId/helpful')
  toggleHelpful(
    @Param('threadId') threadId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.discussionsService.toggleHelpful(threadId, user);
  }

  @Patch('discussions/:threadId/pin')
  togglePin(
    @Param('threadId') threadId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.discussionsService.togglePin(threadId, user);
  }

  private parseTags(tagsJson: string | undefined): string[] {
    if (!tagsJson) return [];
    try {
      const parsed: unknown = JSON.parse(tagsJson);
      return Array.isArray(parsed)
        ? parsed.filter((t): t is string => typeof t === 'string')
        : [];
    } catch {
      return [];
    }
  }
}
