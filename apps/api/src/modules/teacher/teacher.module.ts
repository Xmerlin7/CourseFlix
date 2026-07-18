import { Module } from '@nestjs/common';
import { CoursesModule } from '../courses/courses.module';
import { TeacherController } from './teacher.controller';
import { TeacherService } from './teacher.service';

@Module({
  imports: [CoursesModule],
  controllers: [TeacherController],
  providers: [TeacherService],
})
export class TeacherModule {}
