import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderItemEntity } from '../commerce/entities/order-item.entity';
import { OrderEntity } from '../commerce/entities/order.entity';
import { CoursesModule } from '../courses/courses.module';
import { SessionsModule } from '../sessions/sessions.module';
import { SalesController } from './sales.controller';
import { SalesService } from './sales.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([OrderEntity, OrderItemEntity]),
    // findOwnedCourses scopes every aggregate to the caller's courses;
    // SessionsModule keeps AuthGuard's SessionsService resolvable in this
    // module's DI context (CF-BUG-001).
    CoursesModule,
    SessionsModule,
  ],
  controllers: [SalesController],
  providers: [SalesService],
  exports: [SalesService],
})
export class SalesModule {}
