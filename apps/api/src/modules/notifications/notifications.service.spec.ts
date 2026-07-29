import { ForbiddenException, NotFoundException } from '@nestjs/common';
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
  };

  const userA = 'user-a';
  const userB = 'user-b';

  beforeEach(async () => {
    notificationsRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      count: jest.fn(),
      create: jest.fn((input: Partial<NotificationEntity>) => input),
      save: jest.fn((input: Partial<NotificationEntity>) => ({
        id: 'notification-1',
        ...input,
      })),
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
