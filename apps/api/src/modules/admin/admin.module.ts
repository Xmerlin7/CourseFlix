import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../users/entities/user.entity';
import { CourseEntity } from '../courses/entities/course.entity';
import { EnrollmentEntity } from '../enrollments/entities/enrollment.entity';
import { OrderEntity } from '../commerce/entities/order.entity';
import { OrderItemEntity } from '../commerce/entities/order-item.entity';
import { PaymentEntity } from '../commerce/entities/payment.entity';
import { UsersModule } from '../users/users.module';
import { CoursesModule } from '../courses/courses.module';
import { SessionsModule } from '../sessions/sessions.module';
import { AdminUsersController } from './controllers/admin-users.controller';
import { AdminUsersService } from './services/admin-users.service';
import { AdminCoursesController } from './controllers/admin-courses.controller';
import { AdminCoursesService } from './services/admin-courses.service';
import { AdminOrdersController } from './controllers/admin-orders.controller';
import { AdminOrdersService } from './services/admin-orders.service';

@Module({
  // SessionsModule is required directly here (not just transitively) for
  // AuthGuard to resolve SessionsService within this module's DI context —
  // same gotcha documented in teacher.module.ts (CF-BUG-001).
  imports: [
    TypeOrmModule.forFeature([
      UserEntity,
      CourseEntity,
      EnrollmentEntity,
      OrderEntity,
      OrderItemEntity,
      PaymentEntity,
    ]),
    UsersModule,
    CoursesModule,
    SessionsModule,
  ],
  controllers: [AdminUsersController, AdminCoursesController, AdminOrdersController],
  providers: [AdminUsersService, AdminCoursesService, AdminOrdersService],
})
export class AdminModule {}
