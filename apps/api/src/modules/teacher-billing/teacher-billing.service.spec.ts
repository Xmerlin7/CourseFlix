import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test } from '@nestjs/testing';
import { IsNull, In } from 'typeorm';
import { UserEntity } from '../users/entities/user.entity';
import { TeacherQuotaEntity } from './entities/teacher-quota.entity';
import {
  DEFAULT_MONTHLY_ALLOWANCE,
  TeacherBillingService,
} from './teacher-billing.service';

describe('TeacherBillingService', () => {
  let service: TeacherBillingService;
  let quotaRepository: {
    findOne: jest.Mock;
    find: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };
  let usersRepository: { findOne: jest.Mock; find: jest.Mock };

  const teacherId = 'teacher-1';
  const quotaRow = (
    overrides: Partial<TeacherQuotaEntity> = {},
  ): TeacherQuotaEntity => ({
    id: 'quota-1',
    teacherId,
    monthlyAllowance: DEFAULT_MONTHLY_ALLOWANCE,
    totalCredits: DEFAULT_MONTHLY_ALLOWANCE,
    usedCredits: 0,
    resetAt: new Date(Date.UTC(2099, 0, 1)),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });

  beforeEach(async () => {
    quotaRepository = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn((data: Partial<TeacherQuotaEntity>) => data),
      save: jest.fn((quota: TeacherQuotaEntity) => Promise.resolve(quota)),
    };
    usersRepository = {
      findOne: jest.fn(),
      find: jest.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        TeacherBillingService,
        {
          provide: getRepositoryToken(TeacherQuotaEntity),
          useValue: quotaRepository,
        },
        { provide: getRepositoryToken(UserEntity), useValue: usersRepository },
      ],
    }).compile();

    service = moduleRef.get(TeacherBillingService);
  });

  describe('getQuotaForTeacher', () => {
    it('returns the existing row with remaining and percent fields', async () => {
      quotaRepository.findOne.mockResolvedValue(
        quotaRow({ totalCredits: 100, usedCredits: 25 }),
      );

      const quota = await service.getQuotaForTeacher(teacherId);

      expect(quota.totalCredits).toBe(100);
      expect(quota.usedCredits).toBe(25);
      expect(quota.remainingCredits).toBe(75);
      expect(quota.percentUsed).toBe(25);
    });

    it('creates a default row on first access for a real teacher', async () => {
      quotaRepository.findOne.mockResolvedValue(null);
      usersRepository.findOne.mockResolvedValue({
        id: teacherId,
        role: 'teacher',
      });

      const quota = await service.getQuotaForTeacher(teacherId);

      expect(quotaRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          teacherId,
          monthlyAllowance: DEFAULT_MONTHLY_ALLOWANCE,
          totalCredits: DEFAULT_MONTHLY_ALLOWANCE,
          usedCredits: 0,
        }),
      );
      expect(quota.remainingCredits).toBe(DEFAULT_MONTHLY_ALLOWANCE);
    });

    it('rejects a non-teacher user', async () => {
      quotaRepository.findOne.mockResolvedValue(null);
      usersRepository.findOne.mockResolvedValue({
        id: 'student-1',
        role: 'student',
      });

      await expect(service.getQuotaForTeacher('student-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('refills to the allowance and zeroes usage when the month turned over', async () => {
      quotaRepository.findOne.mockResolvedValue(
        quotaRow({
          monthlyAllowance: 100,
          totalCredits: 200,
          usedCredits: 80,
          resetAt: new Date(Date.UTC(2000, 0, 1)),
        }),
      );

      const quota = await service.getQuotaForTeacher(teacherId);

      expect(quota.totalCredits).toBe(100);
      expect(quota.usedCredits).toBe(0);
      expect(quota.remainingCredits).toBe(100);
      expect(quota.resetAt).not.toBe(
        new Date(Date.UTC(2000, 0, 1)).toISOString(),
      );
    });
  });

  describe('topUp', () => {
    it('adds credit on top of the current balance', async () => {
      quotaRepository.findOne.mockResolvedValue(
        quotaRow({ totalCredits: 100, usedCredits: 30 }),
      );
      usersRepository.findOne.mockResolvedValue({
        id: teacherId,
        role: 'teacher',
      });

      const quota = await service.topUp(teacherId, 50);

      expect(quotaRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ totalCredits: 150 }),
      );
      expect(quota.totalCredits).toBe(150);
    });
  });

  describe('consumeCredits', () => {
    it('counts usage beyond the balance without blocking', async () => {
      quotaRepository.findOne.mockResolvedValue(
        quotaRow({ totalCredits: 100, usedCredits: 95 }),
      );

      const quota = await service.consumeCredits(teacherId, 20);

      expect(quota.usedCredits).toBe(115);
      expect(quota.remainingCredits).toBe(0);
      expect(quota.percentUsed).toBe(100);
    });
  });

  describe('listQuotas', () => {
    it('merges teacher users with their quota rows', async () => {
      usersRepository.find.mockResolvedValue([
        {
          id: teacherId,
          fullName: 'محمد عبدالرحمن',
          email: 'teacher@courseflix.local',
          createdAt: new Date(),
        },
      ]);
      quotaRepository.find.mockResolvedValue([
        quotaRow({ teacherId, totalCredits: 120, usedCredits: 40 }),
      ]);

      const list = await service.listQuotas();

      expect(usersRepository.find).toHaveBeenCalledWith({
        where: { role: 'teacher', deletedAt: IsNull() },
        order: { createdAt: 'ASC' },
      });
      expect(quotaRepository.find).toHaveBeenCalledWith({
        where: { teacherId: In([teacherId]) },
      });
      expect(list[0]).toEqual(
        expect.objectContaining({
          teacherId,
          teacherName: 'محمد عبدالرحمن',
          teacherEmail: 'teacher@courseflix.local',
          totalCredits: 120,
          usedCredits: 40,
          remainingCredits: 80,
        }),
      );
    });

    it('reports default values for a teacher without a row yet', async () => {
      usersRepository.find.mockResolvedValue([
        {
          id: teacherId,
          fullName: 'محمد عبدالرحمن',
          email: 'teacher@courseflix.local',
          createdAt: new Date(),
        },
      ]);
      quotaRepository.find.mockResolvedValue([]);

      const list = await service.listQuotas();

      expect(list[0].totalCredits).toBe(DEFAULT_MONTHLY_ALLOWANCE);
      expect(list[0].usedCredits).toBe(0);
    });
  });
});
