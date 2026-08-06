import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Repository } from 'typeorm';
import { NotificationEntity } from '../../notifications/entities/notification.entity';
import { UserEntity } from '../../users/entities/user.entity';
import { ListAdminNotificationsQueryDto } from '../dto/list-admin-notifications-query.dto';

export interface AdminNotificationListItem {
  id: string;
  userId: string;
  userName: string;
  type: NotificationEntity['type'];
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

const MAX_RESULTS = 200;

// List + delete only — this is a platform-wide audit view for support/
// debugging, not something an admin edits. notifications.user_id is
// ON DELETE CASCADE, so deletion here carries no FK risk.
@Injectable()
export class AdminNotificationsService {
  constructor(
    @InjectRepository(NotificationEntity)
    private readonly notificationsRepository: Repository<NotificationEntity>,
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
  ) {}

  async listNotifications(
    query: ListAdminNotificationsQueryDto,
  ): Promise<AdminNotificationListItem[]> {
    const where: Record<string, unknown> = { deletedAt: IsNull() };
    if (query.userId) where.userId = query.userId;

    const notifications = await this.notificationsRepository.find({
      where,
      order: { createdAt: 'DESC' },
      take: MAX_RESULTS,
    });

    const userNames = await this.loadUserNames(
      notifications.map((item) => item.userId),
    );

    return notifications.map((item) => ({
      id: item.id,
      userId: item.userId,
      userName: userNames.get(item.userId) ?? '—',
      type: item.type,
      title: item.title,
      message: item.message,
      isRead: item.isRead,
      createdAt: item.createdAt.toISOString(),
    }));
  }

  async deleteNotification(notificationId: string): Promise<void> {
    const notification = await this.notificationsRepository.findOne({
      where: { id: notificationId, deletedAt: IsNull() },
    });
    if (!notification) {
      throw new NotFoundException('Notification not found.');
    }
    await this.notificationsRepository.softRemove(notification);
  }

  private async loadUserNames(userIds: string[]): Promise<Map<string, string>> {
    const uniqueIds = [...new Set(userIds)];
    if (uniqueIds.length === 0) {
      return new Map();
    }
    const users = await this.usersRepository.find({
      where: { id: In(uniqueIds) },
    });
    return new Map(users.map((user) => [user.id, user.fullName]));
  }
}
