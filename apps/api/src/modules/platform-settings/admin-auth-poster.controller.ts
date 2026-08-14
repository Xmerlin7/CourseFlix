import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard';
import { AdminRoleGuard } from '../auth/guards/admin-role.guard';
import { UpdateAuthPosterDto } from './dto/update-auth-poster.dto';
import { PlatformSettingsService } from './platform-settings.service';

@Controller('api/v1/admin/auth-poster')
@UseGuards(AuthGuard, AdminRoleGuard)
export class AdminAuthPosterController {
  constructor(
    private readonly platformSettingsService: PlatformSettingsService,
  ) {}

  @Get()
  getAuthPoster() {
    return this.platformSettingsService.getAdminAuthPoster();
  }

  @Patch()
  updateAuthPoster(@Body() dto: UpdateAuthPosterDto) {
    return this.platformSettingsService.updateAuthPoster(
      dto.featuredCourseId,
      undefined,
      dto.customization,
    );
  }
}
