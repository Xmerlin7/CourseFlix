import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthGuard } from '../auth/guards/auth.guard';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { NotificationsService } from './notifications.service';

@Controller('api/v1/notifications')
@UseGuards(AuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  getNotifications(
    @CurrentUser() user: AuthenticatedUser,
    @Query('status') status?: string,
    @Query('type') type?: string,
  ) {
    return this.notificationsService.listForUser(user.id, { status, type });
  }

  @Get('unread-count')
  getUnreadCount(@CurrentUser() user: AuthenticatedUser) {
    return this.notificationsService.getUnreadCount(user.id);
  }

  // Static path — registered before the dynamic `:notificationId/read`
  // route below so it can never be swallowed by it.
  @Patch('read-all')
  markAllRead(@CurrentUser() user: AuthenticatedUser) {
    return this.notificationsService.markAllRead(user.id);
  }

  @Patch('mark-entity-read')
  async markEntityRead(
    @Body() body: { relatedEntityType: string; relatedEntityId: string },
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const updated = await this.notificationsService.markEntityRead(
      user.id,
      body.relatedEntityType,
      body.relatedEntityId,
    );
    return { updated };
  }

  @Patch(':notificationId/read')
  markRead(
    @Param('notificationId') notificationId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.notificationsService.markRead(notificationId, user.id);
  }
}
