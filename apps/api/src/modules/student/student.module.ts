import { Module } from '@nestjs/common';
import { EnrollmentsModule } from '../enrollments/enrollments.module';
import { SessionsModule } from '../sessions/sessions.module';
import { StudentController } from './student.controller';
import { StudentService } from './student.service';

@Module({
  imports: [EnrollmentsModule, SessionsModule],
  controllers: [StudentController],
  providers: [StudentService],
})
export class StudentModule {}