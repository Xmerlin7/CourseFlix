import { ForbiddenException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test } from '@nestjs/testing';
import { In, IsNull } from 'typeorm';
import { EnrollmentsService } from './enrollments.service';
import { EnrollmentEntity } from './entities/enrollment.entity';

describe('EnrollmentsService', () => {
  let enrollmentsService: EnrollmentsService;
  let enrollmentsRepository: { findOne: jest.Mock };

  beforeEach(async () => {
    enrollmentsRepository = { findOne: jest.fn() };

    const moduleRef = await Test.createTestingModule({
      providers: [
        EnrollmentsService,
        {
          provide: getRepositoryToken(EnrollmentEntity),
          useValue: enrollmentsRepository,
        },
      ],
    }).compile();

    enrollmentsService = moduleRef.get(EnrollmentsService);
  });

  // Regression guard: this gate used to filter on `status: 'active'`
  // alone, which 403'd every student the moment they completed a course —
  // while StudentCourseCard still linked them to it as "مراجعة الدورة".
  describe('assertStudentEnrolled', () => {
    it('accepts both active and completed enrollments, but not suspended ones', async () => {
      enrollmentsRepository.findOne.mockResolvedValue({
        id: 'enrollment-1',
      });

      await enrollmentsService.assertStudentEnrolled('student-1', 'course-1');

      expect(enrollmentsRepository.findOne).toHaveBeenCalledWith({
        where: {
          studentId: 'student-1',
          courseId: 'course-1',
          status: In(['active', 'completed']),
          deletedAt: IsNull(),
        },
      });
    });

    it('returns the matched enrollment', async () => {
      const enrollment = { id: 'enrollment-1' } as EnrollmentEntity;
      enrollmentsRepository.findOne.mockResolvedValue(enrollment);

      await expect(
        enrollmentsService.assertStudentEnrolled('student-1', 'course-1'),
      ).resolves.toBe(enrollment);
    });

    it('throws 403 when no active or completed enrollment matches', async () => {
      enrollmentsRepository.findOne.mockResolvedValue(null);

      await expect(
        enrollmentsService.assertStudentEnrolled('student-1', 'course-1'),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
