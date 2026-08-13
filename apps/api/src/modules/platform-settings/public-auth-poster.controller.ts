import { Controller, Get } from '@nestjs/common';
import { PlatformSettingsService } from './platform-settings.service';

@Controller('api/v1/public/auth-poster')
export class PublicAuthPosterController {
  constructor(
    private readonly platformSettingsService: PlatformSettingsService,
  ) {}

  @Get()
  getAuthPoster() {
    return this.platformSettingsService.getPublicAuthPoster();
  }
}
