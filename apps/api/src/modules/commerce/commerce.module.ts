import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CoursesModule } from '../courses/courses.module';
import { EnrollmentEntity } from '../enrollments/entities/enrollment.entity';
import { SessionsModule } from '../sessions/sessions.module';
import { CheckoutController } from './checkout.controller';
import { CommerceService } from './commerce.service';
import { OrderItemEntity } from './entities/order-item.entity';
import { OrderEntity } from './entities/order.entity';
import { PaymentEntity } from './entities/payment.entity';
import { OrdersController } from './orders.controller';
import { PAYMENT_ADAPTER } from './payments/payment-adapter.interface';
import { TestPaymentAdapter } from './payments/test-payment-adapter';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      OrderEntity,
      OrderItemEntity,
      PaymentEntity,
      EnrollmentEntity,
    ]),
    // CoursesService.findCourseById resolves the course title/status for
    // the snapshot and the "already owned" check uses EnrollmentEntity.
    // SessionsModule keeps AuthGuard's SessionsService resolvable in this
    // module's DI context (same CF-BUG-001 fix as TeacherModule).
    CoursesModule,
    SessionsModule,
  ],
  controllers: [CheckoutController, OrdersController],
  providers: [
    CommerceService,
    { provide: PAYMENT_ADAPTER, useClass: TestPaymentAdapter },
  ],
  exports: [CommerceService],
})
export class CommerceModule {}
