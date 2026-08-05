import { BadRequestException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test } from '@nestjs/testing';
import { CoursesService } from '../courses/courses.service';
import { OrderEntity } from '../commerce/entities/order.entity';
import { SalesService } from './sales.service';

describe('SalesService', () => {
  let salesService: SalesService;
  let ordersRepository: { createQueryBuilder: jest.Mock };
  let queryBuilder: Record<string, jest.Mock>;
  let coursesService: { findOwnedCourses: jest.Mock };

  const teacherA = 'teacher-a';
  const teacherB = 'teacher-b';
  const courseOwnedByA = 'course-a-1';
  const courseOwnedByA2 = 'course-a-2';

  beforeEach(async () => {
    queryBuilder = {
      innerJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      addGroupBy: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getRawMany: jest.fn(),
    };
    ordersRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
    };
    coursesService = {
      findOwnedCourses: jest.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        SalesService,
        {
          provide: getRepositoryToken(OrderEntity),
          useValue: ordersRepository,
        },
        { provide: CoursesService, useValue: coursesService },
      ],
    }).compile();

    salesService = moduleRef.get(SalesService);
  });

  describe('getSummary', () => {
    it('reconciles revenue, orders and best seller against the ledger', async () => {
      coursesService.findOwnedCourses.mockResolvedValue([
        { id: courseOwnedByA },
        { id: courseOwnedByA2 },
      ]);
      queryBuilder.getRawMany.mockResolvedValue([
        {
          courseId: courseOwnedByA,
          courseTitle: 'الميكانيكا الكلاسيكية',
          revenueMinor: '100000',
          ordersCount: '2',
        },
        {
          courseId: courseOwnedByA2,
          courseTitle: 'الكهرومغناطيسية',
          revenueMinor: '50000',
          ordersCount: '1',
        },
      ]);

      const result = await salesService.getSummary(teacherA);

      expect(result.revenueMinor).toBe(150000);
      expect(result.ordersCount).toBe(3);
      expect(result.currency).toBe('EGP');
      expect(result.bestSeller).toEqual(
        expect.objectContaining({
          courseId: courseOwnedByA,
          ordersCount: 2,
          revenueMinor: 100000,
        }),
      );
    });

    it('only ever queries paid orders within the owned courses', async () => {
      coursesService.findOwnedCourses.mockResolvedValue([
        { id: courseOwnedByA },
      ]);
      queryBuilder.getRawMany.mockResolvedValue([]);

      await salesService.getSummary(teacherA);

      expect(coursesService.findOwnedCourses).toHaveBeenCalledWith(teacherA);
      expect(queryBuilder.where).toHaveBeenCalledWith(
        'order.status = :status',
        { status: 'paid' },
      );
      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'item.course_id IN (:...courseIds)',
        { courseIds: [courseOwnedByA] },
      );
    });

    it('returns a zero summary when the teacher owns no courses', async () => {
      coursesService.findOwnedCourses.mockResolvedValue([]);

      const result = await salesService.getSummary(teacherB);

      expect(result.revenueMinor).toBe(0);
      expect(result.ordersCount).toBe(0);
      expect(result.bestSeller).toBeNull();
      expect(ordersRepository.createQueryBuilder).not.toHaveBeenCalled();
    });

    it('rejects an invalid range', async () => {
      coursesService.findOwnedCourses.mockResolvedValue([
        { id: courseOwnedByA },
      ]);

      await expect(
        salesService.getSummary(teacherA, {
          from: '2026-08-06T00:00:00.000Z',
          to: '2026-08-01T00:00:00.000Z',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects an unparseable date', async () => {
      coursesService.findOwnedCourses.mockResolvedValue([
        { id: courseOwnedByA },
      ]);

      await expect(
        salesService.getSummary(teacherA, { from: 'not-a-date' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getBestSellers', () => {
    it('returns top courses ordered by revenue, capped by limit', async () => {
      coursesService.findOwnedCourses.mockResolvedValue([
        { id: courseOwnedByA },
      ]);
      queryBuilder.getRawMany.mockResolvedValue([
        {
          courseId: courseOwnedByA,
          courseTitle: 'الميكانيكا الكلاسيكية',
          revenueMinor: '50000',
          ordersCount: '1',
        },
        {
          courseId: courseOwnedByA2,
          courseTitle: 'الكهرومغناطيسية',
          revenueMinor: '50000',
          ordersCount: '1',
        },
      ]);

      const result = await salesService.getBestSellers(teacherA, {}, 1);

      expect(result).toHaveLength(1);
      expect(result[0].courseId).toBe(courseOwnedByA);
    });

    it('returns empty list when the teacher owns no courses', async () => {
      coursesService.findOwnedCourses.mockResolvedValue([]);

      const result = await salesService.getBestSellers(teacherB);

      expect(result).toEqual([]);
    });
  });
});
