import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test } from '@nestjs/testing';
import { NotificationsService } from './notifications.service';
import { NotificationEntity } from './entities/notification.entity';

describe('NotificationsService', () => {
  let notificationsService: NotificationsService;
  let notificationsRepository: {
    find: jest.Mock;
    findOne: jest.Mock;
    count: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    createQueryBuilder: jest.Mock;
  };
  let updateQueryBuilder: {
    update: jest.Mock;
    set: jest.Mock;
    where: jest.Mock;
    andWhere: jest.Mock;
    execute: jest.Mock;
  };

  const userA = 'user-a';
  const userB = 'user-b';

  beforeEach(async () => {
    updateQueryBuilder = {
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      execute: jest.fn().mockResolvedValue({ affected: 2 }),
    };

    notificationsRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      count: jest.fn(),
      create: jest.fn((input: Partial<NotificationEntity>) => input),
      save: jest.fn((input: Partial<NotificationEntity>) => ({
        id: 'notification-1',
        ...input,
      })),
      createQueryBuilder: jest.fn(() => updateQueryBuilder),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: getRepositoryToken(NotificationEntity),
          useValue: notificationsRepository,
        },
      ],
    }).compile();

    notificationsService = moduleRef.get(NotificationsService);
  });

  describe('notify', () => {
    it('creates a notification row scoped to the target user', async () => {
      await notificationsService.notify({
        userId: userA,
        type: 'course_update',
        title: 'عنوان',
        message: 'رسالة',
      });

      expect(notificationsRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: userA,
          type: 'course_update',
          title: 'عنوان',
          message: 'رسالة',
          relatedEntityType: null,
          relatedEntityId: null,
        }),
      );
    });
  });

  describe('listForUser', () => {
    it("only ever queries by the caller's own userId", async () => {
      notificationsRepository.find.mockResolvedValue([]);

      await notificationsService.listForUser(userA);

      const [callArgs] = notificationsRepository.find.mock.calls[0] as [
        { where: { userId: string } },
      ];
      expect(callArgs.where.userId).toBe(userA);
    });

    it('applies an unread status filter', async () => {
      notificationsRepository.find.mockResolvedValue([]);

      await notificationsService.listForUser(userA, { status: 'unread' });

      const [callArgs] = notificationsRepository.find.mock.calls[0] as [
        { where: { isRead?: boolean } },
      ];
      expect(callArgs.where.isRead).toBe(false);
    });

    it('applies a type filter', async () => {
      notificationsRepository.find.mockResolvedValue([]);

      await notificationsService.listForUser(userA, { type: 'quiz_ready' });

      const [callArgs] = notificationsRepository.find.mock.calls[0] as [
        { where: { type?: string } },
      ];
      expect(callArgs.where.type).toBe('quiz_ready');
    });

    it('rejects an invalid status filter', async () => {
      await expect(
        notificationsService.listForUser(userA, { status: 'bogus' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects an invalid type filter', async () => {
      await expect(
        notificationsService.listForUser(userA, { type: 'bogus' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('markAllRead', () => {
    it("scopes the bulk update to the caller's own userId and unread rows only", async () => {
      const result = await notificationsService.markAllRead(userA);

      expect(updateQueryBuilder.where).toHaveBeenCalledWith(
        'user_id = :userId',
        { userId: userA },
      );
      expect(updateQueryBuilder.andWhere).toHaveBeenCalledWith(
        'is_read = false',
      );
      expect(result).toEqual({ updated: 2 });
    });
  });

  describe('getUnreadCount', () => {
    it("counts only this user's unread notifications", async () => {
      notificationsRepository.count.mockResolvedValue(3);

      const result = await notificationsService.getUnreadCount(userA);

      const [callArgs] = notificationsRepository.count.mock.calls[0] as [
        { where: { userId: string; isRead: boolean } },
      ];
      expect(callArgs.where.userId).toBe(userA);
      expect(callArgs.where.isRead).toBe(false);
      expect(result).toEqual({ count: 3 });
    });
  });

  describe('markRead', () => {
    it('throws 404 when the notification does not exist', async () => {
      notificationsRepository.findOne.mockResolvedValue(null);

      await expect(
        notificationsService.markRead('missing', userA),
      ).rejects.toThrow(NotFoundException);
    });

    it("user A can never mark-read user B's notification (403, not a silent no-op)", async () => {
      notificationsRepository.findOne.mockResolvedValue({
        id: 'notification-1',
        userId: userB,
        isRead: false,
      });

      await expect(
        notificationsService.markRead('notification-1', userA),
      ).rejects.toThrow(ForbiddenException);

      expect(notificationsRepository.save).not.toHaveBeenCalled();
    });

    it('marks an unread notification as read and stamps readAt', async () => {
      notificationsRepository.findOne.mockResolvedValue({
        id: 'notification-1',
        userId: userA,
        isRead: false,
        readAt: null,
      });

      const result = await notificationsService.markRead(
        'notification-1',
        userA,
      );

      expect(notificationsRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ isRead: true }),
      );
      const [savedArg] = notificationsRepository.save.mock.calls[0] as [
        { readAt: Date },
      ];
      expect(savedArg.readAt).toBeInstanceOf(Date);
      expect(result).toEqual({ id: 'notification-1', isRead: true });
    });

    it('is a no-op (no extra write) when already read', async () => {
      notificationsRepository.findOne.mockResolvedValue({
        id: 'notification-1',
        userId: userA,
        isRead: true,
        readAt: new Date('2026-01-01'),
      });

      const result = await notificationsService.markRead(
        'notification-1',
        userA,
      );

      expect(notificationsRepository.save).not.toHaveBeenCalled();
      expect(result).toEqual({ id: 'notification-1', isRead: true });
    });
  });
});
