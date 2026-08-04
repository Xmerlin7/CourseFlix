import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { CoursesService } from '../courses/courses.service';
import { EnrollmentEntity } from '../enrollments/entities/enrollment.entity';
import { CommerceService } from './commerce.service';
import { OrderItemEntity } from './entities/order-item.entity';
import { OrderEntity } from './entities/order.entity';
import { PaymentEntity } from './entities/payment.entity';
import {
  PAYMENT_ADAPTER,
  PaymentAdapter,
} from './payments/payment-adapter.interface';
import { TestPaymentAdapter } from './payments/test-payment-adapter';

describe('CommerceService', () => {
  let commerceService: CommerceService;
  let ordersRepository: {
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };
  let orderItemsRepository: {
    find: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };
  let paymentsRepository: { count: jest.Mock };
  let enrollmentsRepository: { findOne: jest.Mock };
  let coursesService: {
    findCourseById: jest.Mock;
    findOwnedCourses: jest.Mock;
  };

  const studentId = 'student-1';
  const courseId = 'course-1';
  const orderId = 'order-1';
  const publishedCourse = {
    id: courseId,
    title: 'الميكانيكا الكلاسيكية',
    status: 'published',
  };

  function mockManager() {
    const orderRepo = {
      findOne: jest.fn(),
      save: jest.fn(),
    };
    const paymentRepo = {
      count: jest.fn().mockResolvedValue(0),
      create: jest.fn((input: Partial<PaymentEntity>) => input),
      save: jest.fn(),
    };
    const enrollmentRepo = {
      findOne: jest.fn(),
      create: jest.fn((input: Partial<EnrollmentEntity>) => input),
      save: jest.fn(),
    };
    return {
      getRepository: jest.fn((entity: unknown) => {
        if (entity === OrderEntity) return orderRepo;
        if (entity === PaymentEntity) return paymentRepo;
        return enrollmentRepo;
      }),
      orderRepo,
      paymentRepo,
      enrollmentRepo,
    };
  }

  beforeEach(async () => {
    ordersRepository = {
      findOne: jest.fn(),
      create: jest.fn((input: Partial<OrderEntity>) => input),
      save: jest.fn((input: Partial<OrderEntity>) => ({
        id: orderId,
        createdAt: new Date('2026-08-04T10:00:00.000Z'),
        ...input,
      })),
    };
    orderItemsRepository = {
      find: jest.fn(),
      create: jest.fn((input: Partial<OrderItemEntity>) => input),
      save: jest.fn((input: Partial<OrderItemEntity>) => ({
        id: 'item-1',
        createdAt: new Date('2026-08-04T10:00:00.000Z'),
        ...input,
      })),
    };
    paymentsRepository = { count: jest.fn() };
    enrollmentsRepository = { findOne: jest.fn() };
    coursesService = {
      findCourseById: jest.fn(),
      findOwnedCourses: jest.fn(),
    };

    const paymentAdapter: PaymentAdapter = new TestPaymentAdapter();

    const moduleRef = await Test.createTestingModule({
      providers: [
        CommerceService,
        {
          provide: getRepositoryToken(OrderEntity),
          useValue: ordersRepository,
        },
        {
          provide: getRepositoryToken(OrderItemEntity),
          useValue: orderItemsRepository,
        },
        {
          provide: getRepositoryToken(PaymentEntity),
          useValue: paymentsRepository,
        },
        {
          provide: getRepositoryToken(EnrollmentEntity),
          useValue: enrollmentsRepository,
        },
        { provide: CoursesService, useValue: coursesService },
        { provide: PAYMENT_ADAPTER, useValue: paymentAdapter },
        // @InjectDataSource() resolves against the DataSource class token;
        // each confirm test overrides the service's dataSource directly
        // with a manager-backed transaction mock.
        { provide: DataSource, useValue: { transaction: jest.fn() } },
      ],
    }).compile();

    commerceService = moduleRef.get(CommerceService);
  });

  describe('createDraftOrder', () => {
    it('creates a pending order with server-set price and currency', async () => {
      coursesService.findCourseById.mockResolvedValue(publishedCourse);
      enrollmentsRepository.findOne.mockResolvedValue(null);

      const result = await commerceService.createDraftOrder(studentId, {
        courseId,
      });

      expect(result.status).toBe('pending');
      expect(result.paymentStatus).toBe('pending');
      expect(result.currency).toBe('EGP');
      expect(result.amountMinor).toBeGreaterThan(0);
      expect(result.orderReference).toBe(orderId);
      expect(result.items[0]).toEqual(
        expect.objectContaining({ courseId, title: publishedCourse.title }),
      );
    });

    it('rejects a course the student already owns', async () => {
      coursesService.findCourseById.mockResolvedValue(publishedCourse);
      enrollmentsRepository.findOne.mockResolvedValue({ id: 'enrollment-1' });

      await expect(
        commerceService.createDraftOrder(studentId, { courseId }),
      ).rejects.toThrow(ConflictException);
    });

    it('rejects a non-published course', async () => {
      coursesService.findCourseById.mockResolvedValue({
        ...publishedCourse,
        status: 'draft',
      });

      await expect(
        commerceService.createDraftOrder(studentId, { courseId }),
      ).rejects.toThrow(ConflictException);
    });

    it('returns the existing order for a repeated idempotency key', async () => {
      coursesService.findCourseById.mockResolvedValue(publishedCourse);
      enrollmentsRepository.findOne.mockResolvedValue(null);
      ordersRepository.findOne.mockResolvedValue({
        id: 'existing-order',
        studentId,
        status: 'pending',
        paymentStatus: 'pending',
        currency: 'EGP',
        totalMinor: 50000,
        idempotencyKey: 'key-1',
        createdAt: new Date('2026-08-04T10:00:00.000Z'),
        paidAt: null,
      });
      orderItemsRepository.find.mockResolvedValue([]);

      const result = await commerceService.createDraftOrder(studentId, {
        courseId,
        idempotencyKey: 'key-1',
      });

      expect(result.orderReference).toBe('existing-order');
      expect(ordersRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('confirmOrder', () => {
    it('marks the order paid and ensures a single enrollment on success', async () => {
      const manager = mockManager();
      const transaction = jest.fn(
        async <T>(
          fn: (manager: ReturnType<typeof mockManager>) => Promise<T>,
        ): Promise<T> => fn(manager),
      );
      const dataSource = { transaction };
      (commerceService as unknown as { dataSource: unknown }).dataSource =
        dataSource;

      manager.orderRepo.findOne.mockResolvedValue({
        id: orderId,
        studentId,
        status: 'pending',
        paymentStatus: 'pending',
        currency: 'EGP',
        totalMinor: 50000,
        createdAt: new Date('2026-08-04T10:00:00.000Z'),
        paidAt: null,
      });
      manager.orderRepo.save.mockImplementation(
        (order: Partial<OrderEntity>) => order,
      );
      orderItemsRepository.find.mockResolvedValue([
        {
          id: 'item-1',
          orderId,
          courseId,
          titleSnapshot: publishedCourse.title,
          priceMinor: 50000,
        },
      ]);
      manager.enrollmentRepo.findOne.mockResolvedValue(null);

      const result = await commerceService.confirmOrder(studentId, orderId, {
        simulate: 'success',
      });

      expect(result.status).toBe('paid');
      expect(result.paymentStatus).toBe('paid');
      expect(result.paidAt).not.toBeNull();
      expect(manager.paymentRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'paid',
          externalRef: 'test-ok',
          attemptNo: 1,
        }),
      );
      expect(manager.enrollmentRepo.save).toHaveBeenCalled();
    });

    it('does not create a second enrollment when one already exists', async () => {
      const manager = mockManager();
      const transaction = jest.fn(
        async <T>(
          fn: (manager: ReturnType<typeof mockManager>) => Promise<T>,
        ): Promise<T> => fn(manager),
      );
      const dataSource = { transaction };
      (commerceService as unknown as { dataSource: unknown }).dataSource =
        dataSource;

      manager.orderRepo.findOne.mockResolvedValue({
        id: orderId,
        studentId,
        status: 'pending',
        paymentStatus: 'pending',
        currency: 'EGP',
        totalMinor: 50000,
        createdAt: new Date('2026-08-04T10:00:00.000Z'),
        paidAt: null,
      });
      manager.orderRepo.save.mockImplementation(
        (order: Partial<OrderEntity>) => order,
      );
      orderItemsRepository.find.mockResolvedValue([
        {
          id: 'item-1',
          orderId,
          courseId,
          titleSnapshot: publishedCourse.title,
          priceMinor: 50000,
        },
      ]);
      manager.enrollmentRepo.findOne.mockResolvedValue({ id: 'existing' });

      await commerceService.confirmOrder(studentId, orderId, {
        simulate: 'success',
      });

      expect(manager.enrollmentRepo.save).not.toHaveBeenCalled();
    });

    it('records a failed payment attempt and stays retryable on decline', async () => {
      const manager = mockManager();
      const transaction = jest.fn(
        async <T>(
          fn: (manager: ReturnType<typeof mockManager>) => Promise<T>,
        ): Promise<T> => fn(manager),
      );
      const dataSource = { transaction };
      (commerceService as unknown as { dataSource: unknown }).dataSource =
        dataSource;

      manager.orderRepo.findOne.mockResolvedValue({
        id: orderId,
        studentId,
        status: 'pending',
        paymentStatus: 'pending',
        currency: 'EGP',
        totalMinor: 50000,
        createdAt: new Date('2026-08-04T10:00:00.000Z'),
        paidAt: null,
      });
      manager.orderRepo.save.mockImplementation(
        (order: Partial<OrderEntity>) => order,
      );
      orderItemsRepository.find.mockResolvedValue([
        {
          id: 'item-1',
          orderId,
          courseId,
          titleSnapshot: 'c',
          priceMinor: 50000,
        },
      ]);

      const result = await commerceService.confirmOrder(studentId, orderId, {
        simulate: 'decline',
      });

      expect(result.status).toBe('pending');
      expect(result.paymentStatus).toBe('failed');
      expect(manager.paymentRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'failed',
          externalRef: 'test-declined',
        }),
      );
      expect(manager.enrollmentRepo.save).not.toHaveBeenCalled();
    });

    it('returns the authoritative paid order on a duplicate confirm', async () => {
      const manager = mockManager();
      const transaction = jest.fn(
        async <T>(
          fn: (manager: ReturnType<typeof mockManager>) => Promise<T>,
        ): Promise<T> => fn(manager),
      );
      const dataSource = { transaction };
      (commerceService as unknown as { dataSource: unknown }).dataSource =
        dataSource;

      manager.orderRepo.findOne.mockResolvedValue({
        id: orderId,
        studentId,
        status: 'paid',
        paymentStatus: 'paid',
        currency: 'EGP',
        totalMinor: 50000,
        createdAt: new Date('2026-08-04T10:00:00.000Z'),
        paidAt: new Date('2026-08-04T10:05:00.000Z'),
      });
      orderItemsRepository.find.mockResolvedValue([
        {
          id: 'item-1',
          orderId,
          courseId,
          titleSnapshot: 'c',
          priceMinor: 50000,
        },
      ]);

      const result = await commerceService.confirmOrder(studentId, orderId, {});

      expect(result.status).toBe('paid');
      expect(manager.paymentRepo.save).not.toHaveBeenCalled();
      expect(manager.orderRepo.save).not.toHaveBeenCalled();
      expect(manager.enrollmentRepo.save).not.toHaveBeenCalled();
    });

    it('rejects confirmation of another student order with 404 (not found)', async () => {
      const manager = mockManager();
      const transaction = jest.fn(
        async <T>(
          fn: (manager: ReturnType<typeof mockManager>) => Promise<T>,
        ): Promise<T> => fn(manager),
      );
      const dataSource = { transaction };
      (commerceService as unknown as { dataSource: unknown }).dataSource =
        dataSource;

      manager.orderRepo.findOne.mockResolvedValue(null);

      await expect(
        commerceService.confirmOrder('other-student', orderId, {}),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getOrder', () => {
    it('rejects reading another student receipt', async () => {
      ordersRepository.findOne.mockResolvedValue({
        id: orderId,
        studentId: 'someone-else',
        status: 'paid',
      });

      await expect(
        commerceService.getOrder(studentId, orderId),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
