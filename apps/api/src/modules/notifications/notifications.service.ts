import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import type {
  NotificationProducerPort,
  NotifyInput,
} from '../../common/ports/notification-producer.port';
import {
  NotificationEntity,
  NotificationType,
} from './entities/notification.entity';

export interface NotificationResponse {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface UnreadCountResponse {
  count: number;
}

export interface MarkReadResponse {
  id: string;
  isRead: boolean;
}

@Injectable()
export class NotificationsService implements NotificationProducerPort {
  constructor(
    @InjectRepository(NotificationEntity)
    private readonly notificationsRepository: Repository<NotificationEntity>,
  ) {}

  // NotificationProducerPort implementation — called by other modules
  // (Elgendy's ingestion worker, once wired up) to write a notification.
  // Not exposed over HTTP: there is no client-facing "create notification"
  // endpoint, only list/count/mark-read.
  async notify(input: NotifyInput): Promise<void> {
    await this.notificationsRepository.save(
      this.notificationsRepository.create({
        userId: input.userId,
        type: input.type as NotificationType,
        title: input.title,
        message: input.message,
        relatedEntityType: input.relatedEntityType ?? null,
        relatedEntityId: input.relatedEntityId ?? null,
      }),
    );
  }

  // Scoped by the session-derived userId only — never a query param, so
  // one user can never list another's notifications.
  async listForUser(userId: string): Promise<NotificationResponse[]> {
    const notifications = await this.notificationsRepository.find({
      where: { userId, deletedAt: IsNull() },
      order: { createdAt: 'DESC' },
    });

    return notifications.map((notification) => this.toResponse(notification));
  }

  async getUnreadCount(userId: string): Promise<UnreadCountResponse> {
    const count = await this.notificationsRepository.count({
      where: { userId, isRead: false, deletedAt: IsNull() },
    });
    return { count };
  }

  async markRead(
    notificationId: string,
    userId: string,
  ): Promise<MarkReadResponse> {
    const notification = await this.notificationsRepository.findOne({
      where: { id: notificationId, deletedAt: IsNull() },
    });
    if (!notification) {
      throw new NotFoundException('Notification not found.');
    }
    if (notification.userId !== userId) {
      throw new ForbiddenException('You do not own this notification.');
    }

    if (!notification.isRead) {
      notification.isRead = true;
      notification.readAt = new Date();
      await this.notificationsRepository.save(notification);
    }

    return { id: notification.id, isRead: notification.isRead };
  }

  private toResponse(notification: NotificationEntity): NotificationResponse {
    return {
      id: notification.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      isRead: notification.isRead,
      createdAt: notification.createdAt.toISOString(),
    };
  }
}
