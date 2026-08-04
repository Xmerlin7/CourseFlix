import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';

@Module({
  imports: [
    // نفس الـ queue اللي JobsModule مسجلها - BullModule.registerQueue
    // آمن تناديها تاني بنفس الاسم من module تاني، الاتنين بيرجعوا لنفس
    // الـ queue/اتصال Redis الأساسي. إحنا بس محتاجينها هنا عشان نعمل
    // ping لـ Redis في فحص الـ readiness.
    BullModule.registerQueue({ name: 'ingestion' }),
  ],
  controllers: [HealthController],
  providers: [HealthService],
})
export class HealthModule {}
