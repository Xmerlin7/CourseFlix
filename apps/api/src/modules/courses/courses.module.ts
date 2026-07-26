import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EnrollmentsModule } from '../enrollments/enrollments.module';
import { SessionsModule } from '../sessions/sessions.module';
import { CoursesController } from './courses.controller';
import { CoursesService } from './courses.service';
import { CourseEntity } from './entities/course.entity';
import { SectionEntity } from './entities/section.entity';
import { LessonEntity } from './entities/lesson.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([CourseEntity, SectionEntity, LessonEntity]),
    EnrollmentsModule,
    // Required for CoursesController's AuthGuard to resolve
    // SessionsService within this module's DI context (CF-BUG-001).
    SessionsModule,
  ],
  controllers: [CoursesController],
  providers: [CoursesService],
  exports: [CoursesService],
})
export class CoursesModule {}
