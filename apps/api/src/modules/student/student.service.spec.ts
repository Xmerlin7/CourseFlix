import { BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { CoursesService } from '../courses/courses.service';
import { EnrollmentsService } from '../enrollments/enrollments.service';
import { UsersService } from '../users/users.service';
import { StudentService } from './student.service';

describe('StudentService', () => {
  let studentService: StudentService;
  let enrollmentsService: { findStudentEnrollments: jest.Mock };
  let coursesService: { findByIds: jest.Mock };
  let usersService: { findById: jest.Mock };

  const studentId = 'student-1';

  const mechanicsCourse = {
    id: 'course-1',
    title: 'الميكانيكا الكلاسيكية',
    coverImageUrl: null,
    gradeLevel: 'الصف الأول الثانوي',
  };

  const electroCourse = {
    id: 'course-2',
    title: 'الكهرومغناطيسية',
    coverImageUrl: null,
    gradeLevel: 'الصف الثالث الثانوي',
  };

  const enrollments = [
    {
      id: 'enrollment-1',
      courseId: mechanicsCourse.id,
      status: 'active' as const,
      enrolledAt: new Date('2026-07-01T00:00:00.000Z'),
    },
    {
      id: 'enrollment-2',
      courseId: electroCourse.id,
      status: 'completed' as const,
      enrolledAt: new Date('2026-06-01T00:00:00.000Z'),
    },
  ];

  beforeEach(async () => {
    enrollmentsService = { findStudentEnrollments: jest.fn() };
    coursesService = { findByIds: jest.fn() };
    usersService = { findById: jest.fn() };

    const moduleRef = await Test.createTestingModule({
      providers: [
        StudentService,
        { provide: EnrollmentsService, useValue: enrollmentsService },
        { provide: CoursesService, useValue: coursesService },
        { provide: UsersService, useValue: usersService },
      ],
    }).compile();

    studentService = moduleRef.get(StudentService);
  });

  describe('getDashboard', () => {
    it('enriches recent courses and the student profile from real data', async () => {
      enrollmentsService.findStudentEnrollments.mockResolvedValue(enrollments);
      coursesService.findByIds.mockResolvedValue([
        mechanicsCourse,
        electroCourse,
      ]);
      usersService.findById.mockResolvedValue({
        fullName: 'عبدالله حبسه',
        email: 'student@courseflix.local',
        avatarUrl: null,
      });

      const result = await studentService.getDashboard(studentId);

      expect(result.student).toEqual({
        id: studentId,
        fullName: 'عبدالله حبسه',
        email: 'student@courseflix.local',
        avatarUrl: null,
      });
      expect(result.stats).toEqual({
        enrolledCoursesCount: 2,
        activeCoursesCount: 1,
      });
      // Sorted by enrolledAt DESC — the more recently enrolled course first.
      expect(result.recentCourses[0]).toEqual({
        courseId: mechanicsCourse.id,
        courseTitle: mechanicsCourse.title,
        coverImageUrl: null,
        status: 'active',
        enrolledAt: enrollments[0].enrolledAt,
      });
    });

    it('falls back to null course fields when the course lookup misses', async () => {
      enrollmentsService.findStudentEnrollments.mockResolvedValue([
        enrollments[0],
      ]);
      coursesService.findByIds.mockResolvedValue([]);
      usersService.findById.mockResolvedValue(null);

      const result = await studentService.getDashboard(studentId);

      expect(result.recentCourses[0].courseTitle).toBeNull();
      expect(result.student.fullName).toBeNull();
    });
  });

  describe('getEnrollments', () => {
    it('enriches enrollments with course title and grade level', async () => {
      enrollmentsService.findStudentEnrollments.mockResolvedValue(enrollments);
      coursesService.findByIds.mockResolvedValue([
        mechanicsCourse,
        electroCourse,
      ]);

      const result = await studentService.getEnrollments(studentId, {});

      expect(result).toEqual([
        {
          id: 'enrollment-1',
          courseId: mechanicsCourse.id,
          courseTitle: mechanicsCourse.title,
          gradeLevel: mechanicsCourse.gradeLevel,
          status: 'active',
        },
        {
          id: 'enrollment-2',
          courseId: electroCourse.id,
          courseTitle: electroCourse.title,
          gradeLevel: electroCourse.gradeLevel,
          status: 'completed',
        },
      ]);
    });

    it('filters by gradeLevel after enrichment', async () => {
      enrollmentsService.findStudentEnrollments.mockResolvedValue(enrollments);
      coursesService.findByIds.mockResolvedValue([
        mechanicsCourse,
        electroCourse,
      ]);

      const result = await studentService.getEnrollments(studentId, {
        gradeLevel: electroCourse.gradeLevel,
      });

      expect(result).toHaveLength(1);
      expect(result[0].courseId).toBe(electroCourse.id);
    });

    it('rejects an invalid status filter with 400', async () => {
      await expect(
        studentService.getEnrollments(studentId, { status: 'bogus' }),
      ).rejects.toThrow(BadRequestException);
      expect(enrollmentsService.findStudentEnrollments).not.toHaveBeenCalled();
    });
  });
});
