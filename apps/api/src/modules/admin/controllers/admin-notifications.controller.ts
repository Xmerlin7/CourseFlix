import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../../auth/guards/auth.guard';
import { AdminRoleGuard } from '../../auth/guards/admin-role.guard';
import { AdminNotificationsService } from '../services/admin-notifications.service';
import { ListAdminNotificationsQueryDto } from '../dto/list-admin-notifications-query.dto';
import { SendAdminNotificationDto } from '../dto/send-admin-notification.dto';

@Controller('api/v1/admin/notifications-log')
@UseGuards(AuthGuard, AdminRoleGuard)
export class AdminNotificationsController {
  constructor(
    private readonly adminNotificationsService: AdminNotificationsService,
  ) {}

  @Get()
  listNotifications(@Query() query: ListAdminNotificationsQueryDto) {
    return this.adminNotificationsService.listNotifications(query);
  }

  @Post('send')
  @HttpCode(HttpStatus.CREATED)
  async sendNotification(@Body() dto: SendAdminNotificationDto) {
    await this.adminNotificationsService.sendNotification(dto);
  }

  @Delete(':notificationId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteNotification(@Param('notificationId') notificationId: string) {
    await this.adminNotificationsService.deleteNotification(notificationId);
  }
}
