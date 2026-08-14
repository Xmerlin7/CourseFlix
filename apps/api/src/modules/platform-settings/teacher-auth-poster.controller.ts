import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthGuard } from '../auth/guards/auth.guard';
import { TeacherRoleGuard } from '../auth/guards/teacher-role.guard';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { UpdateAuthPosterDto } from './dto/update-auth-poster.dto';
import { PlatformSettingsService } from './platform-settings.service';

@Controller('api/v1/teacher/auth-poster')
@UseGuards(AuthGuard, TeacherRoleGuard)
export class TeacherAuthPosterController {
  constructor(
    private readonly platformSettingsService: PlatformSettingsService,
  ) {}

  @Get()
  getAuthPoster() {
    return this.platformSettingsService.getAdminAuthPoster();
  }

  @Patch()
  updateAuthPoster(
    @Body() dto: UpdateAuthPosterDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.platformSettingsService.updateAuthPoster(
      dto.featuredCourseId,
      user.id,
      dto.customization,
    );
  }
}
