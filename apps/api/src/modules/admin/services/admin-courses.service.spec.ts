import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CourseEntity } from '../../courses/entities/course.entity';
import { CoursesService } from '../../courses/courses.service';
import { AdminCoursesService } from './admin-courses.service';

describe('AdminCoursesService', () => {
  let service: AdminCoursesService;
  let coursesRepository: { find: jest.Mock };
  let coursesService: {
    getCourseDetailForAdmin: jest.Mock;
    updateCourseMetadata: jest.Mock;
    deleteCourse: jest.Mock;
    findCourseById: jest.Mock;
  };

  const courseId = 'course-1';
  const teacherId = 'teacher-1';

  beforeEach(async () => {
    coursesRepository = { find: jest.fn() };
    coursesService = {
      getCourseDetailForAdmin: jest.fn(),
      updateCourseMetadata: jest.fn(),
      deleteCourse: jest.fn(),
      findCourseById: jest.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        AdminCoursesService,
        { provide: getRepositoryToken(CourseEntity), useValue: coursesRepository },
        { provide: CoursesService, useValue: coursesService },
      ],
    }).compile();

    service = moduleRef.get(AdminCoursesService);
  });

  describe('listCourses', () => {
    it('maps courses to list items with the teacher name', async () => {
      coursesRepository.find.mockResolvedValue([
        {
          id: courseId,
          title: 'الفيزياء',
          slug: 'physics',
          gradeLevel: 'الصف الثالث الثانوي',
          status: 'published',
          teacherId,
          teacher: { fullName: 'محمد عبدالرحمن' },
          createdAt: new Date('2026-01-01T00:00:00Z'),
        },
      ]);

      const result = await service.listCourses({});

      expect(result).toEqual([
        {
          id: courseId,
          title: 'الفيزياء',
          slug: 'physics',
          gradeLevel: 'الصف الثالث الثانوي',
          status: 'published',
          teacherId,
          teacherName: 'محمد عبدالرحمن',
          createdAt: '2026-01-01T00:00:00.000Z',
        },
      ]);
    });
  });

  describe('updateCourse', () => {
    it('resolves the real owning teacherId before delegating to CoursesService', async () => {
      coursesService.findCourseById.mockResolvedValue({ id: courseId, teacherId });
      coursesService.updateCourseMetadata.mockResolvedValue({});
      coursesService.getCourseDetailForAdmin.mockResolvedValue({ id: courseId });

      await service.updateCourse(courseId, { title: 'New Title' });

      expect(coursesService.updateCourseMetadata).toHaveBeenCalledWith(
        courseId,
        teacherId,
        { title: 'New Title' },
      );
    });

    it('throws NotFoundException when the course does not exist', async () => {
      coursesService.findCourseById.mockResolvedValue(null);
      await expect(
        service.updateCourse('missing', { title: 'x' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteCourse', () => {
    it('resolves the real owning teacherId before delegating the soft delete', async () => {
      coursesService.findCourseById.mockResolvedValue({ id: courseId, teacherId });

      await service.deleteCourse(courseId);

      expect(coursesService.deleteCourse).toHaveBeenCalledWith(courseId, teacherId);
    });
  });
});
