import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LessonEntity } from '../courses/entities/lesson.entity';
import { EnrollmentsModule } from '../enrollments/enrollments.module';
import { SessionsModule } from '../sessions/sessions.module';
import { AttendanceService } from './attendance.service';
import { AttendanceEntity } from './entities/attendance.entity';
import { ContentProgressEntity } from './entities/content-progress.entity';
import { VideoEntity } from './entities/video.entity';
import { LessonsController } from './lessons.controller';
import { LessonsService } from './lessons.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      LessonEntity,
      VideoEntity,
      ContentProgressEntity,
      AttendanceEntity,
    ]),
    EnrollmentsModule,
    // Required for AuthGuard to resolve SessionsService within this
    // module's own DI context (same fix as CF-BUG-001 in TeacherModule).
    SessionsModule,
  ],
  controllers: [LessonsController],
  providers: [LessonsService, AttendanceService],
})
export class LessonsModule {}
