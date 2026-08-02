import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AttendanceEntity } from './entities/attendance.entity';

const DEFAULT_ATTENDANCE_THRESHOLD_PERCENT = 70;
const POSTGRES_UNIQUE_VIOLATION = '23505';

export interface EvaluateAttendanceInput {
  studentId: string;
  videoId: string;
  watchedSeconds: number;
  watchedPercentage: number;
}

@Injectable()
export class AttendanceService {
  private readonly thresholdPercent: number;

  constructor(
    @InjectRepository(AttendanceEntity)
    private readonly attendanceRepository: Repository<AttendanceEntity>,
  ) {
    this.thresholdPercent = Number(
      process.env.ATTENDANCE_THRESHOLD_PERCENT ??
        DEFAULT_ATTENDANCE_THRESHOLD_PERCENT,
    );
  }

  /**
   * Awards attendance for (studentId, videoId) the moment watchedPercentage
   * crosses the threshold. Returns `true` only on the exact call that
   * creates the row — `false` on every other call, including below-
   * threshold heartbeats and replays after attendance was already awarded.
   *
   * The real guarantee isn't the read-then-write shape below — it's
   * `uq_attendance_student_video`. Ten concurrent heartbeats that all
   * cross the threshold at once all attempt the insert; only one can win,
   * and the rest hit the unique violation caught below and no-op. See
   * attendance.service.spec.ts.
   */
  async evaluateAndAward(
    input: EvaluateAttendanceInput,
  ): Promise<boolean> {
    if (input.watchedPercentage < this.thresholdPercent) {
      return false;
    }

    const existing = await this.attendanceRepository.findOne({
      where: { studentId: input.studentId, videoId: input.videoId },
    });
    if (existing) {
      return false;
    }

    try {
      await this.attendanceRepository.insert({
        studentId: input.studentId,
        videoId: input.videoId,
        watchedSeconds: input.watchedSeconds,
        watchedPercentage: input.watchedPercentage.toFixed(2),
        isPresent: true,
        lastHeartbeatAt: new Date(),
        lastUpdatedAt: new Date(),
      });
      return true;
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        return false;
      }
      throw error;
    }
  }

  private isUniqueViolation(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: string }).code === POSTGRES_UNIQUE_VIOLATION
    );
  }
}
