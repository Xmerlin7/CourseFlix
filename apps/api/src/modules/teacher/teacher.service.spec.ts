import { BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { CoursesService } from '../courses/courses.service';
import { EnrollmentsService } from '../enrollments/enrollments.service';
import { TeacherService } from './teacher.service';

describe('TeacherService', () => {
  let teacherService: TeacherService;
  let coursesService: {
    findOwnedCourses: jest.Mock;
    updateCourseMetadata: jest.Mock;
  };
  let enrollmentsService: { countActiveStudentsByCourseIds: jest.Mock };

  const teacherId = 'teacher-1';

  const courses = [
    {
      id: 'course-1',
      title: 'الميكانيكا الكلاسيكية',
      description: null,
      coverImageUrl: null,
      gradeLevel: 'الصف الأول الثانوي',
      status: 'published',
    },
    {
      id: 'course-2',
      title: 'الكهرومغناطيسية',
      description: null,
      coverImageUrl: null,
      gradeLevel: 'الصف الثالث الثانوي',
      status: 'draft',
    },
  ];

  beforeEach(async () => {
    coursesService = {
      findOwnedCourses: jest.fn(),
      updateCourseMetadata: jest.fn(),
    };
    enrollmentsService = { countActiveStudentsByCourseIds: jest.fn() };

    const moduleRef = await Test.createTestingModule({
      providers: [
        TeacherService,
        { provide: CoursesService, useValue: coursesService },
        { provide: EnrollmentsService, useValue: enrollmentsService },
      ],
    }).compile();

    teacherService = moduleRef.get(TeacherService);
  });

  describe('getDashboard', () => {
    it('summarizes owned/published course counts and enrolled students', async () => {
      coursesService.findOwnedCourses.mockResolvedValue(courses);
      enrollmentsService.countActiveStudentsByCourseIds.mockResolvedValue(12);

      const result = await teacherService.getDashboard(teacherId);

      expect(coursesService.findOwnedCourses).toHaveBeenCalledWith(teacherId);
      expect(
        enrollmentsService.countActiveStudentsByCourseIds,
      ).toHaveBeenCalledWith(['course-1', 'course-2']);
      expect(result.stats).toEqual({
        ownedCourseCount: 2,
        publishedCourseCount: 1,
        enrolledStudentCount: 12,
      });
      expect(result.recentCourses).toHaveLength(2);
    });
  });

  describe('getCourses', () => {
    it('passes an undefined status through untouched', async () => {
      coursesService.findOwnedCourses.mockResolvedValue(courses);

      await teacherService.getCourses(teacherId);

      expect(coursesService.findOwnedCourses).toHaveBeenCalledWith(
        teacherId,
        undefined,
      );
    });

    it('validates the status filter and rejects garbage input', async () => {
      await expect(
        teacherService.getCourses(teacherId, 'not-a-status'),
      ).rejects.toThrow(BadRequestException);
      expect(coursesService.findOwnedCourses).not.toHaveBeenCalled();
    });

    it('accepts a valid status filter', async () => {
      coursesService.findOwnedCourses.mockResolvedValue([courses[0]]);

      await teacherService.getCourses(teacherId, 'published');

      expect(coursesService.findOwnedCourses).toHaveBeenCalledWith(
        teacherId,
        'published',
      );
    });
  });

  describe('updateCourse', () => {
    it('delegates ownership-checked persistence to CoursesService', async () => {
      coursesService.updateCourseMetadata.mockResolvedValue(courses[0]);

      const result = await teacherService.updateCourse(
        courses[0].id,
        teacherId,
        { title: 'New Title' },
      );

      expect(coursesService.updateCourseMetadata).toHaveBeenCalledWith(
        courses[0].id,
        teacherId,
        { title: 'New Title' },
      );
      expect(result.id).toBe(courses[0].id);
    });
  });
});
