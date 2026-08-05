import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test } from '@nestjs/testing';
import { CourseEntity } from '../courses/entities/course.entity';
import { LessonEntity } from '../courses/entities/lesson.entity';
import { EnrollmentsService } from '../enrollments/enrollments.service';
import { AttendanceService } from './attendance.service';
import { ContentProgressEntity } from './entities/content-progress.entity';
import { VideoEntity } from './entities/video.entity';
import { LessonsService } from './lessons.service';

describe('LessonsService', () => {
  let lessonsService: LessonsService;
  let lessonsRepository: { findOne: jest.Mock };
  let coursesRepository: {
    createQueryBuilder: jest.Mock;
  };
  let videosRepository: { find: jest.Mock; findOne: jest.Mock };
  let progressRepository: {
    find: jest.Mock;
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    update: jest.Mock;
  };
  let enrollmentsService: { assertStudentEnrolled: jest.Mock };
  let attendanceService: { evaluateAndAward: jest.Mock };

  const studentId = 'student-1';
  const courseId = 'course-1';
  const lessonId = 'lesson-1';
  const videoId = 'video-1';
  const completedLessonId = 'lesson-2';
  const completedVideoId = 'video-2';

  const lesson = {
    id: lessonId,
    courseId,
    sectionId: 'section-1',
    title: 'الدرس الأول',
  } as LessonEntity;
  const course = {
    id: courseId,
    title: 'فيزياء',
    teacherId: 'teacher-1',
    sections: [
      {
        id: 'section-1',
        title: 'القسم الأول',
        sortOrder: 1,
        lessons: [
          {
            id: lessonId,
            title: 'الدرس الأول',
            sortOrder: 1,
          },
          {
            id: completedLessonId,
            title: 'الدرس المكتمل',
            sortOrder: 2,
          },
        ],
      },
    ],
  } as CourseEntity;
  // 200s of a 400s video = 50%.
  const video = {
    id: videoId,
    lessonId,
    videoUrl: 'https://example.test/video.mp4',
    durationSeconds: 400,
  } as VideoEntity;
  const completedVideo = {
    id: completedVideoId,
    lessonId: completedLessonId,
    videoUrl: 'https://example.test/completed.mp4',
    durationSeconds: 300,
  } as VideoEntity;

  beforeEach(async () => {
    lessonsRepository = { findOne: jest.fn().mockResolvedValue(lesson) };
    coursesRepository = {
      createQueryBuilder: jest.fn(() => ({
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(course),
      })),
    };
    videosRepository = {
      find: jest.fn().mockResolvedValue([video, completedVideo]),
      findOne: jest.fn().mockResolvedValue(video),
    };
    progressRepository = {
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn((input: Partial<ContentProgressEntity>) => input),
      save: jest.fn((input: Partial<ContentProgressEntity>) => ({
        id: 'progress-1',
        ...input,
      })),
      update: jest.fn().mockResolvedValue(undefined),
    };
    enrollmentsService = {
      assertStudentEnrolled: jest.fn().mockResolvedValue(undefined),
    };
    attendanceService = {
      evaluateAndAward: jest.fn().mockResolvedValue(false),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        LessonsService,
        {
          provide: getRepositoryToken(LessonEntity),
          useValue: lessonsRepository,
        },
        {
          provide: getRepositoryToken(CourseEntity),
          useValue: coursesRepository,
        },
        {
          provide: getRepositoryToken(VideoEntity),
          useValue: videosRepository,
        },
        {
          provide: getRepositoryToken(ContentProgressEntity),
          useValue: progressRepository,
        },
        { provide: EnrollmentsService, useValue: enrollmentsService },
        { provide: AttendanceService, useValue: attendanceService },
      ],
    }).compile();

    lessonsService = moduleRef.get(LessonsService);
  });

  describe('getLessonDetail', () => {
    it('returns the zero-state on a first visit, not a 404', async () => {
      const result = await lessonsService.getLessonDetail(lessonId, studentId);

      expect(result.course).toMatchObject({
        id: courseId,
        title: 'فيزياء',
        currentSectionId: 'section-1',
      });
      expect(result.course.sections[0].lessons).toEqual([
        expect.objectContaining({
          id: lessonId,
          progressStatus: 'not_started',
          watchedPercentage: 0,
        }),
        expect.objectContaining({
          id: completedLessonId,
          progressStatus: 'not_started',
          watchedPercentage: 0,
        }),
      ]);
      expect(result.progress).toEqual({
        lastPositionSeconds: 0,
        watchedPercentage: 0,
        status: 'not_started',
      });
    });

    it('resume returns the saved position', async () => {
      progressRepository.findOne.mockResolvedValue({
        lastVideoPosition: 120,
        progressPercentage: '45.00',
        status: 'in_progress',
      });

      const result = await lessonsService.getLessonDetail(lessonId, studentId);

      expect(result.progress).toEqual({
        lastPositionSeconds: 120,
        watchedPercentage: 45,
        status: 'in_progress',
      });
    });

    it('returns per-lesson progress in the course outline', async () => {
      progressRepository.find.mockResolvedValue([
        {
          videoId: completedVideoId,
          progressPercentage: '100.00',
          status: 'completed',
        },
      ]);

      const result = await lessonsService.getLessonDetail(lessonId, studentId);

      expect(result.course.sections[0].lessons[1]).toMatchObject({
        id: completedLessonId,
        progressStatus: 'completed',
        watchedPercentage: 100,
      });
    });

    it('rejects with 404 when the lesson does not exist', async () => {
      lessonsRepository.findOne.mockResolvedValue(null);

      await expect(
        lessonsService.getLessonDetail(lessonId, studentId),
      ).rejects.toThrow(NotFoundException);
    });

    it('an unenrolled student gets 403', async () => {
      enrollmentsService.assertStudentEnrolled.mockRejectedValue(
        new ForbiddenException('You are not enrolled in this course.'),
      );

      await expect(
        lessonsService.getLessonDetail(lessonId, studentId),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('updateProgress', () => {
    it('checks enrollment for exactly the calling student — nobody else can be substituted', async () => {
      await lessonsService.updateProgress(lessonId, studentId, {
        positionSeconds: 10,
        watchedSeconds: 10,
      });

      expect(enrollmentsService.assertStudentEnrolled).toHaveBeenCalledWith(
        studentId,
        courseId,
      );
    });

    it('an unenrolled student gets 403 and no progress row is written', async () => {
      enrollmentsService.assertStudentEnrolled.mockRejectedValue(
        new ForbiddenException('You are not enrolled in this course.'),
      );

      await expect(
        lessonsService.updateProgress(lessonId, studentId, {
          positionSeconds: 10,
          watchedSeconds: 10,
        }),
      ).rejects.toThrow(ForbiddenException);
      expect(progressRepository.save).not.toHaveBeenCalled();
      expect(progressRepository.update).not.toHaveBeenCalled();
    });

    it('a lower watchedSeconds does not regress stored progress', async () => {
      // Stored high-water mark: 200/400 = 50%.
      progressRepository.findOne.mockResolvedValue({
        id: 'progress-1',
        progressPercentage: '50.00',
        completedAt: null,
      });

      const result = await lessonsService.updateProgress(lessonId, studentId, {
        positionSeconds: 20,
        watchedSeconds: 40, // 10%, lower than the stored 50%
      });

      expect(result.watchedPercentage).toBe(50);
      expect(progressRepository.update).toHaveBeenCalledWith(
        'progress-1',
        expect.objectContaining({ progressPercentage: '50.00' }),
      );
    });

    it('duplicate heartbeats are idempotent', async () => {
      progressRepository.findOne.mockResolvedValue({
        id: 'progress-1',
        progressPercentage: '50.00',
        completedAt: null,
      });

      const first = await lessonsService.updateProgress(lessonId, studentId, {
        positionSeconds: 200,
        watchedSeconds: 200,
      });
      const second = await lessonsService.updateProgress(lessonId, studentId, {
        positionSeconds: 200,
        watchedSeconds: 200,
      });

      expect(first.watchedPercentage).toBe(50);
      expect(second.watchedPercentage).toBe(50);
    });

    it('uses the client-reported duration when the stored video duration is missing', async () => {
      videosRepository.findOne.mockResolvedValue({
        ...video,
        durationSeconds: null,
      });
      progressRepository.findOne.mockResolvedValue(null);

      const result = await lessonsService.updateProgress(lessonId, studentId, {
        positionSeconds: 60,
        watchedSeconds: 60,
        durationSeconds: 600,
      });

      expect(result.watchedPercentage).toBe(10);
      expect(progressRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          progressPercentage: '10.00',
          status: 'in_progress',
        }),
      );
    });

    it('seek-back then replay does not inflate progress', async () => {
      // First heartbeat reaches 80%.
      progressRepository.findOne.mockResolvedValueOnce(null);
      const reached80 = await lessonsService.updateProgress(
        lessonId,
        studentId,
        {
          positionSeconds: 320,
          watchedSeconds: 320,
        },
      );
      expect(reached80.watchedPercentage).toBe(80);

      // Student seeks back to the start and replays only up to 30%.
      progressRepository.findOne.mockResolvedValueOnce({
        id: 'progress-1',
        progressPercentage: '80.00',
        completedAt: null,
      });
      const afterReplay = await lessonsService.updateProgress(
        lessonId,
        studentId,
        {
          positionSeconds: 10,
          watchedSeconds: 120,
        },
      );

      // Position moved (seeking is free) but percentage never drops below
      // the 80% high-water mark already reached.
      expect(afterReplay.watchedPercentage).toBe(80);
      expect(progressRepository.update).toHaveBeenLastCalledWith(
        'progress-1',
        expect.objectContaining({
          lastVideoPosition: 10,
          progressPercentage: '80.00',
        }),
      );
    });

    it('reaching 100% marks the lesson completed', async () => {
      progressRepository.findOne.mockResolvedValue(null);

      const result = await lessonsService.updateProgress(lessonId, studentId, {
        positionSeconds: 400,
        watchedSeconds: 400,
      });

      expect(result.watchedPercentage).toBe(100);
      expect(result.status).toBe('completed');
    });

    it('reports attendanceAwarded exactly as AttendanceService returns it', async () => {
      attendanceService.evaluateAndAward.mockResolvedValue(true);

      const result = await lessonsService.updateProgress(lessonId, studentId, {
        positionSeconds: 280,
        watchedSeconds: 280,
      });

      expect(result.attendanceAwarded).toBe(true);
      expect(attendanceService.evaluateAndAward).toHaveBeenCalledWith({
        studentId,
        videoId,
        watchedSeconds: 280,
        watchedPercentage: 70,
      });
    });
  });
});
