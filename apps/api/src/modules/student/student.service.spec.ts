import { BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { CoursesService } from '../courses/courses.service';
import { EnrollmentsService } from '../enrollments/enrollments.service';
import { LessonsService } from '../lessons/lessons.service';
import { UsersService } from '../users/users.service';
import { StudentService } from './student.service';

describe('StudentService', () => {
  let studentService: StudentService;
  let enrollmentsService: { findStudentEnrollments: jest.Mock };
  let coursesService: { findByIds: jest.Mock };
  let usersService: { findById: jest.Mock };
  let lessonsService: { getCourseProgressSummaries: jest.Mock };

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
    lessonsService = {
      getCourseProgressSummaries: jest.fn().mockResolvedValue(new Map()),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        StudentService,
        { provide: EnrollmentsService, useValue: enrollmentsService },
        { provide: CoursesService, useValue: coursesService },
        { provide: UsersService, useValue: usersService },
        { provide: LessonsService, useValue: lessonsService },
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
        completedCoursesCount: 1,
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

    it('has no overall progress or continue-learning course when no summaries carry lessons', async () => {
      enrollmentsService.findStudentEnrollments.mockResolvedValue(enrollments);
      coursesService.findByIds.mockResolvedValue([
        mechanicsCourse,
        electroCourse,
      ]);
      usersService.findById.mockResolvedValue(null);
      // Default lessonsService mock resolves an empty Map (no summaries).

      const result = await studentService.getDashboard(studentId);

      expect(result.overallProgressPercent).toBeNull();
      expect(result.continueLearning).toBeNull();
    });

    it('averages overallProgressPercent across courses that actually have lessons', async () => {
      enrollmentsService.findStudentEnrollments.mockResolvedValue(enrollments);
      coursesService.findByIds.mockResolvedValue([
        mechanicsCourse,
        electroCourse,
      ]);
      usersService.findById.mockResolvedValue(null);
      lessonsService.getCourseProgressSummaries.mockResolvedValue(
        new Map([
          [
            mechanicsCourse.id,
            {
              totalLessonsCount: 10,
              completedLessonsCount: 4,
              progressPercent: 40,
              currentLesson: {
                id: 'l1',
                title: 'Lesson 1',
                lastVideoPosition: 0,
              },
              lastActivityAt: new Date('2026-08-01T00:00:00.000Z'),
              lastCompletedLesson: null,
            },
          ],
          [
            electroCourse.id,
            {
              totalLessonsCount: 0,
              completedLessonsCount: 0,
              progressPercent: 0,
              currentLesson: null,
              lastActivityAt: null,
              lastCompletedLesson: null,
            },
          ],
        ]),
      );

      const result = await studentService.getDashboard(studentId);

      // electroCourse has 0 total lessons, so it's excluded from the
      // average — only mechanicsCourse's 40% counts.
      expect(result.overallProgressPercent).toBe(40);
    });

    it('picks the most recently active eligible course as continueLearning', async () => {
      enrollmentsService.findStudentEnrollments.mockResolvedValue([
        enrollments[0],
        {
          id: 'enrollment-3',
          courseId: 'course-3',
          status: 'active' as const,
          enrolledAt: new Date('2026-05-01T00:00:00.000Z'),
        },
      ]);
      const thirdCourse = {
        id: 'course-3',
        title: 'الديناميكا الحرارية',
        coverImageUrl: null,
        gradeLevel: 'الصف الثاني الثانوي',
      };
      coursesService.findByIds.mockResolvedValue([
        mechanicsCourse,
        thirdCourse,
      ]);
      usersService.findById.mockResolvedValue(null);

      const olderLesson = {
        id: 'l-old',
        title: 'Older lesson',
        lastVideoPosition: 5,
      };
      const newerLesson = {
        id: 'l-new',
        title: 'Newer lesson',
        lastVideoPosition: 9,
      };
      lessonsService.getCourseProgressSummaries.mockResolvedValue(
        new Map([
          [
            mechanicsCourse.id,
            {
              totalLessonsCount: 10,
              completedLessonsCount: 3,
              progressPercent: 30,
              currentLesson: olderLesson,
              lastActivityAt: new Date('2026-08-01T00:00:00.000Z'),
              lastCompletedLesson: null,
            },
          ],
          [
            'course-3',
            {
              totalLessonsCount: 10,
              completedLessonsCount: 5,
              progressPercent: 50,
              currentLesson: newerLesson,
              lastActivityAt: new Date('2026-08-09T00:00:00.000Z'),
              lastCompletedLesson: null,
            },
          ],
        ]),
      );

      const result = await studentService.getDashboard(studentId);

      expect(result.continueLearning).toEqual({
        courseId: 'course-3',
        courseTitle: thirdCourse.title,
        coverImageUrl: null,
        gradeLevel: thirdCourse.gradeLevel,
        progressPercent: 50,
        completedLessonsCount: 5,
        totalLessonsCount: 10,
        currentLesson: newerLesson,
      });
    });

    it('excludes suspended, completed, not-started, and finished courses from continueLearning', async () => {
      enrollmentsService.findStudentEnrollments.mockResolvedValue(enrollments);
      coursesService.findByIds.mockResolvedValue([
        mechanicsCourse,
        electroCourse,
      ]);
      usersService.findById.mockResolvedValue(null);
      lessonsService.getCourseProgressSummaries.mockResolvedValue(
        new Map([
          [
            mechanicsCourse.id,
            {
              // active enrollment, but 100% complete — nothing left to resume.
              totalLessonsCount: 10,
              completedLessonsCount: 10,
              progressPercent: 100,
              currentLesson: null,
              lastActivityAt: new Date('2026-08-01T00:00:00.000Z'),
              lastCompletedLesson: {
                id: 'l1',
                title: 'Last',
                lastVideoPosition: 10,
              },
            },
          ],
          [
            electroCourse.id,
            {
              // enrollment.status is 'completed', even though progress isn't 100.
              totalLessonsCount: 10,
              completedLessonsCount: 5,
              progressPercent: 50,
              currentLesson: { id: 'l2', title: 'Mid', lastVideoPosition: 5 },
              lastActivityAt: new Date('2026-08-05T00:00:00.000Z'),
              lastCompletedLesson: null,
            },
          ],
        ]),
      );

      const result = await studentService.getDashboard(studentId);

      expect(result.continueLearning).toBeNull();
    });

    it('builds recentActivity from enrollment and lesson-completion events, newest first', async () => {
      enrollmentsService.findStudentEnrollments.mockResolvedValue(enrollments);
      coursesService.findByIds.mockResolvedValue([
        mechanicsCourse,
        electroCourse,
      ]);
      usersService.findById.mockResolvedValue(null);
      lessonsService.getCourseProgressSummaries.mockResolvedValue(
        new Map([
          [
            mechanicsCourse.id,
            {
              totalLessonsCount: 10,
              completedLessonsCount: 3,
              progressPercent: 30,
              currentLesson: {
                id: 'l1',
                title: 'Lesson 4',
                lastVideoPosition: 0,
              },
              lastActivityAt: new Date('2026-08-08T00:00:00.000Z'),
              lastCompletedLesson: {
                id: 'l-done',
                title: 'قانون نيوتن الثالث',
                lastVideoPosition: 400,
              },
            },
          ],
        ]),
      );

      const result = await studentService.getDashboard(studentId);

      expect(result.recentActivity[0]).toEqual({
        type: 'lesson_completed',
        courseId: mechanicsCourse.id,
        courseTitle: mechanicsCourse.title,
        lessonTitle: 'قانون نيوتن الثالث',
        occurredAt: '2026-08-08T00:00:00.000Z',
      });
      // Both enrollments' "enrolled" events should also be present.
      expect(result.recentActivity.map((event) => event.type)).toEqual(
        expect.arrayContaining(['enrolled', 'lesson_completed']),
      );
      expect(result.recentActivity.length).toBeLessThanOrEqual(5);
    });
  });

  describe('getEnrollments', () => {
    it('enriches enrollments with course title, grade level, and cover image', async () => {
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
          coverImageUrl: null,
          gradeLevel: mechanicsCourse.gradeLevel,
          status: 'active',
          progressPercent: 0,
          completedLessonsCount: 0,
          totalLessonsCount: 0,
          currentLesson: null,
          lastActivityAt: enrollments[0].enrolledAt.toISOString(),
        },
        {
          id: 'enrollment-2',
          courseId: electroCourse.id,
          courseTitle: electroCourse.title,
          coverImageUrl: null,
          gradeLevel: electroCourse.gradeLevel,
          status: 'completed',
          progressPercent: 0,
          completedLessonsCount: 0,
          totalLessonsCount: 0,
          currentLesson: null,
          lastActivityAt: enrollments[1].enrolledAt.toISOString(),
        },
      ]);
    });

    it('merges the per-course progress summary from LessonsService', async () => {
      enrollmentsService.findStudentEnrollments.mockResolvedValue([
        enrollments[0],
      ]);
      coursesService.findByIds.mockResolvedValue([mechanicsCourse]);
      const currentLesson = {
        id: 'lesson-6',
        title: 'قانون كولوم',
        lastVideoPosition: 1112,
      };
      lessonsService.getCourseProgressSummaries.mockResolvedValue(
        new Map([
          [
            mechanicsCourse.id,
            {
              totalLessonsCount: 11,
              completedLessonsCount: 6,
              progressPercent: 55,
              currentLesson,
              lastActivityAt: new Date('2026-08-09T18:00:00.000Z'),
            },
          ],
        ]),
      );

      const result = await studentService.getEnrollments(studentId, {});

      expect(lessonsService.getCourseProgressSummaries).toHaveBeenCalledWith(
        studentId,
        [mechanicsCourse.id],
      );
      expect(result[0]).toMatchObject({
        progressPercent: 55,
        completedLessonsCount: 6,
        totalLessonsCount: 11,
        currentLesson,
        lastActivityAt: '2026-08-09T18:00:00.000Z',
      });
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
