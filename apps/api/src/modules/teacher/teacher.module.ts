import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderItemEntity } from '../commerce/entities/order-item.entity';
import { OrderEntity } from '../commerce/entities/order.entity';
import { CoursesModule } from '../courses/courses.module';
import { EnrollmentsModule } from '../enrollments/enrollments.module';
import { EnrollmentEntity } from '../enrollments/entities/enrollment.entity';
import { LessonsModule } from '../lessons/lessons.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { SessionsModule } from '../sessions/sessions.module';
import { UserEntity } from '../users/entities/user.entity';
import { TeacherController } from './teacher.controller';
import { TeacherService } from './teacher.service';

@Module({
  // SessionsModule is required directly here (not just transitively via
  // CoursesModule) for TeacherController's AuthGuard to resolve
  // SessionsService within this module's DI context (CF-BUG-001).
  imports: [
    TypeOrmModule.forFeature([
      UserEntity,
      EnrollmentEntity,
      OrderEntity,
      OrderItemEntity,
    ]),
    CoursesModule,
    EnrollmentsModule,
    LessonsModule,
    NotificationsModule,
    SessionsModule,
  ],
  controllers: [TeacherController],
  providers: [TeacherService],
})
export class TeacherModule {}
