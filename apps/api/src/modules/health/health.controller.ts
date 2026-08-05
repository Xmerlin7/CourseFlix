import { Controller, Get, Res } from '@nestjs/common';
import type { Response } from 'express';
import { HealthService } from './health.service';

@Controller('api/v1/health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  getHealth() {
    return this.healthService.getHealth();
  }

  @Get('live')
  getLive() {
    return this.healthService.getLiveness();
  }

  @Get('ready')
  async getReady(@Res({ passthrough: true }) res: Response) {
    const result = await this.healthService.getReadiness();
    res.status(result.status === 'ok' ? 200 : 503);
    return result;
  }
}
