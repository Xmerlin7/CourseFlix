import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, IsNull, Repository } from 'typeorm';
import type {
  NotificationProducerPort,
  NotifyInput,
} from '../../common/ports/notification-producer.port';
import { UserEntity } from '../users/entities/user.entity';
import {
  NotificationEntity,
  NotificationType,
} from './entities/notification.entity';

export interface NotificationResponse {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  relatedEntityType: string | null;
  relatedEntityId: string | null;
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

export interface MarkAllReadResponse {
  updated: number;
}

export type NotificationStatusFilter = 'unread' | 'read';

export interface NotificationListFilters {
  status?: string;
  type?: string;
}

interface ParsedNotificationListFilters {
  status?: NotificationStatusFilter;
  type?: NotificationType;
}

const VALID_STATUS_FILTERS: readonly NotificationStatusFilter[] = [
  'unread',
  'read',
];

const VALID_TYPE_FILTERS: readonly NotificationType[] = [
  'hw_assigned',
  'quiz_ready',
  'progress_report',
  'announcement',
  'course_update',
  'system',
  'discussion_reply',
  'discussion_accepted',
  'support_ticket_update',
];

function parseStatusFilter(
  value?: string,
): NotificationStatusFilter | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (!VALID_STATUS_FILTERS.includes(value as NotificationStatusFilter)) {
    throw new BadRequestException(
      `Invalid status filter: "${value}". Must be one of ${VALID_STATUS_FILTERS.join(', ')}.`,
    );
  }

  return value as NotificationStatusFilter;
}

function parseTypeFilter(value?: string): NotificationType | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (!VALID_TYPE_FILTERS.includes(value as NotificationType)) {
    throw new BadRequestException(
      `Invalid type filter: "${value}". Must be one of ${VALID_TYPE_FILTERS.join(', ')}.`,
    );
  }

  return value as NotificationType;
}

@Injectable()
export class NotificationsService implements NotificationProducerPort {
  constructor(
    @InjectRepository(NotificationEntity)
    private readonly notificationsRepository: Repository<NotificationEntity>,
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
  ) {}

  // NotificationProducerPort implementation — called by other modules
  // (Elgendy's ingestion worker, once wired up) to write a notification.
  // Not exposed over HTTP: there is no client-facing "create notification"
  // endpoint, only list/count/mark-read.
  async notify(input: NotifyInput): Promise<void> {
    const recipient = await this.usersRepository.findOne({
      where: { id: input.userId },
      select: { id: true, settingsNotificationPreferences: true },
    });
    // A type with no explicit key in the map is enabled by default — see
    // UsersService's KNOWN_NOTIFICATION_TYPES / Settings > Notifications tab.
    if (recipient?.settingsNotificationPreferences?.[input.type] === false) {
      return;
    }

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
  async listForUser(
    userId: string,
    filters: NotificationListFilters = {},
  ): Promise<NotificationResponse[]> {
    const parsed = this.parseFilters(filters);

    const where: FindOptionsWhere<NotificationEntity> = {
      userId,
      deletedAt: IsNull(),
    };
    if (parsed.status === 'unread') {
      where.isRead = false;
    } else if (parsed.status === 'read') {
      where.isRead = true;
    }
    if (parsed.type) {
      where.type = parsed.type;
    }

    const notifications = await this.notificationsRepository.find({
      where,
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

  // Scoped by the session-derived userId only, same as markRead — one
  // user's read-all can never touch another user's rows.
  async markAllRead(userId: string): Promise<MarkAllReadResponse> {
    const result = await this.notificationsRepository
      .createQueryBuilder()
      .update(NotificationEntity)
      .set({ isRead: true, readAt: new Date() })
      .where('user_id = :userId', { userId })
      .andWhere('is_read = false')
      .andWhere('deleted_at IS NULL')
      .execute();

    return { updated: result.affected ?? 0 };
  }

  async markEntityRead(
    userId: string,
    relatedEntityType: string,
    relatedEntityId: string,
  ): Promise<number> {
    const result = await this.notificationsRepository
      .createQueryBuilder()
      .update(NotificationEntity)
      .set({ isRead: true, readAt: new Date() })
      .where('user_id = :userId', { userId })
      .andWhere('related_entity_type = :relatedEntityType', {
        relatedEntityType,
      })
      .andWhere('related_entity_id = :relatedEntityId', { relatedEntityId })
      .andWhere('is_read = false')
      .andWhere('deleted_at IS NULL')
      .execute();

    return result.affected ?? 0;
  }

  async markEntitiesRead(
    userId: string,
    relatedEntityType: string,
    relatedEntityIds: string[],
  ): Promise<number> {
    if (relatedEntityIds.length === 0) return 0;
    const result = await this.notificationsRepository
      .createQueryBuilder()
      .update(NotificationEntity)
      .set({ isRead: true, readAt: new Date() })
      .where('user_id = :userId', { userId })
      .andWhere('related_entity_type = :relatedEntityType', {
        relatedEntityType,
      })
      .andWhere('related_entity_id IN (:...relatedEntityIds)', {
        relatedEntityIds,
      })
      .andWhere('is_read = false')
      .andWhere('deleted_at IS NULL')
      .execute();

    return result.affected ?? 0;
  }

  private parseFilters(
    filters: NotificationListFilters,
  ): ParsedNotificationListFilters {
    return {
      status: parseStatusFilter(filters.status),
      type: parseTypeFilter(filters.type),
    };
  }

  private toResponse(notification: NotificationEntity): NotificationResponse {
    return {
      id: notification.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      relatedEntityType: notification.relatedEntityType,
      relatedEntityId: notification.relatedEntityId,
      isRead: notification.isRead,
      createdAt: notification.createdAt.toISOString(),
    };
  }
}
