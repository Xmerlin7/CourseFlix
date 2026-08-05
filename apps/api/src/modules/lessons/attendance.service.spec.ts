import { getRepositoryToken } from '@nestjs/typeorm';
import { Test } from '@nestjs/testing';
import { AttendanceService } from './attendance.service';
import { AttendanceEntity } from './entities/attendance.entity';

function uniqueViolationError(): Error & { code: string } {
  const error = new Error(
    'duplicate key value violates unique constraint "uq_attendance_student_video"',
  ) as Error & { code: string };
  error.code = '23505';
  return error;
}

describe('AttendanceService', () => {
  let attendanceService: AttendanceService;
  let attendanceRepository: {
    findOne: jest.Mock;
    insert: jest.Mock;
  };

  const studentId = 'student-1';
  const videoId = 'video-1';

  beforeEach(async () => {
    process.env.ATTENDANCE_THRESHOLD_PERCENT = '70';

    attendanceRepository = {
      findOne: jest.fn().mockResolvedValue(null),
      insert: jest
        .fn()
        .mockResolvedValue({ identifiers: [{ id: 'attendance-1' }] }),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        AttendanceService,
        {
          provide: getRepositoryToken(AttendanceEntity),
          useValue: attendanceRepository,
        },
      ],
    }).compile();

    attendanceService = moduleRef.get(AttendanceService);
  });

  afterEach(() => {
    delete process.env.ATTENDANCE_THRESHOLD_PERCENT;
  });

  it('69.9% awards nothing', async () => {
    const awarded = await attendanceService.evaluateAndAward({
      studentId,
      videoId,
      watchedSeconds: 279,
      watchedPercentage: 69.9,
    });

    expect(awarded).toBe(false);
    expect(attendanceRepository.insert).not.toHaveBeenCalled();
  });

  it('70.0% awards exactly one row', async () => {
    const awarded = await attendanceService.evaluateAndAward({
      studentId,
      videoId,
      watchedSeconds: 280,
      watchedPercentage: 70.0,
    });

    expect(awarded).toBe(true);
    expect(attendanceRepository.insert).toHaveBeenCalledTimes(1);
  });

  it('100% still awards exactly one row — a second call is a no-op once one exists', async () => {
    const first = await attendanceService.evaluateAndAward({
      studentId,
      videoId,
      watchedSeconds: 400,
      watchedPercentage: 100,
    });
    expect(first).toBe(true);

    // The row now exists — the read guard finds it before ever attempting
    // another insert.
    attendanceRepository.findOne.mockResolvedValue({ id: 'attendance-1' });

    const second = await attendanceService.evaluateAndAward({
      studentId,
      videoId,
      watchedSeconds: 400,
      watchedPercentage: 100,
    });

    expect(second).toBe(false);
    expect(attendanceRepository.insert).toHaveBeenCalledTimes(1);
  });

  it('ten concurrent heartbeats crossing the threshold at once produce exactly one row', async () => {
    // All ten see no existing row (the race the read guard alone can't
    // close) — only the unique constraint on insert can. The first
    // insert succeeds; every other one hits the unique violation.
    let insertCount = 0;
    attendanceRepository.insert.mockImplementation(() => {
      insertCount += 1;
      if (insertCount > 1) {
        return Promise.reject(uniqueViolationError());
      }
      return Promise.resolve({ identifiers: [{ id: 'attendance-1' }] });
    });

    const results = await Promise.all(
      Array.from({ length: 10 }, () =>
        attendanceService.evaluateAndAward({
          studentId,
          videoId,
          watchedSeconds: 300,
          watchedPercentage: 75,
        }),
      ),
    );

    const awardedCount = results.filter(Boolean).length;
    expect(awardedCount).toBe(1);
    expect(attendanceRepository.insert).toHaveBeenCalledTimes(10);
  });

  it('propagates a non-unique-violation error instead of swallowing it', async () => {
    attendanceRepository.insert.mockRejectedValue(new Error('connection lost'));

    await expect(
      attendanceService.evaluateAndAward({
        studentId,
        videoId,
        watchedSeconds: 300,
        watchedPercentage: 75,
      }),
    ).rejects.toThrow('connection lost');
  });
});
