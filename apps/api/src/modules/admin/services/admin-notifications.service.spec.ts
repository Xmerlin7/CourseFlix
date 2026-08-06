import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotificationEntity } from '../../notifications/entities/notification.entity';
import { UserEntity } from '../../users/entities/user.entity';
import { AdminNotificationsService } from './admin-notifications.service';

describe('AdminNotificationsService', () => {
  let service: AdminNotificationsService;
  let notificationsRepository: {
    find: jest.Mock;
    findOne: jest.Mock;
    softRemove: jest.Mock;
  };
  let usersRepository: { find: jest.Mock };

  beforeEach(async () => {
    notificationsRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      softRemove: jest.fn(),
    };
    usersRepository = { find: jest.fn().mockResolvedValue([]) };

    const moduleRef = await Test.createTestingModule({
      providers: [
        AdminNotificationsService,
        {
          provide: getRepositoryToken(NotificationEntity),
          useValue: notificationsRepository,
        },
        { provide: getRepositoryToken(UserEntity), useValue: usersRepository },
      ],
    }).compile();

    service = moduleRef.get(AdminNotificationsService);
  });

  it('soft-removes an existing notification', async () => {
    const notification = { id: 'n-1', deletedAt: null };
    notificationsRepository.findOne.mockResolvedValue(notification);

    await service.deleteNotification('n-1');

    expect(notificationsRepository.softRemove).toHaveBeenCalledWith(notification);
  });

  it('throws NotFoundException for a missing notification', async () => {
    notificationsRepository.findOne.mockResolvedValue(null);
    await expect(service.deleteNotification('missing')).rejects.toThrow(
      NotFoundException,
    );
  });
});
