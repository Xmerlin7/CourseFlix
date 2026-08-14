import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SessionsModule } from '../sessions/sessions.module';
import { CourseEntity } from '../courses/entities/course.entity';
import { PlatformSettingEntity } from './entities/platform-setting.entity';
import { AdminAuthPosterController } from './admin-auth-poster.controller';
import { PublicAuthPosterController } from './public-auth-poster.controller';
import { PlatformSettingsService } from './platform-settings.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([PlatformSettingEntity, CourseEntity]),
    SessionsModule,
  ],
  controllers: [AdminAuthPosterController, PublicAuthPosterController],
  providers: [PlatformSettingsService],
  exports: [PlatformSettingsService],
})
export class PlatformSettingsModule {}
