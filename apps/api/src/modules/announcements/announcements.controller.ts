import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthGuard } from '../auth/guards/auth.guard';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { AnnouncementsService } from './announcements.service';

type UploadedAttachment = {
  originalname: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
};

function decodeOriginalName(filename: string | undefined): string {
  if (!filename) return '';
  try {
    const decoded = Buffer.from(filename, 'latin1').toString('utf8');
    if (/[؀-ۿ]/.test(decoded)) {
      return decoded;
    }
  } catch {
    // fallback
  }
  return filename;
}

/**
 * Same "one controller, service resolves student-vs-teacher access"
 * shape as DiscussionsController — see its docblock for why.
 */
@Controller('api/v1')
@UseGuards(AuthGuard)
export class AnnouncementsController {
  constructor(private readonly announcementsService: AnnouncementsService) {}

  @Get('courses/:courseId/announcements')
  listAnnouncements(
    @Param('courseId') courseId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.announcementsService.listAnnouncements(courseId, user);
  }

  @Post('courses/:courseId/announcements')
  @UseInterceptors(FileInterceptor('attachment'))
  createAnnouncement(
    @Param('courseId') courseId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body('content') content: string,
    @UploadedFile() attachment?: UploadedAttachment,
  ) {
    return this.announcementsService.createAnnouncement(courseId, user, {
      content: content ?? '',
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

  @Patch('announcements/:postId')
  updateAnnouncement(
    @Param('postId') postId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body('content') content: string,
  ) {
    return this.announcementsService.updateAnnouncement(
      postId,
      user,
      content ?? '',
    );
  }

  @Delete('announcements/:postId')
  deleteAnnouncement(
    @Param('postId') postId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.announcementsService.deleteAnnouncement(postId, user);
  }

  @Patch('announcements/:postId/pin')
  togglePin(
    @Param('postId') postId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.announcementsService.togglePin(postId, user);
  }
}
