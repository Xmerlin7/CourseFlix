import { Injectable } from '@nestjs/common';

@Injectable()
export class HealthService {
  getHealth() {
    return {
      status: 'ok',
      service: 'courseflix-api',
      // TODO: add safe database dependency status without exposing secrets or paths.
      dependencies: {
        database: 'not_configured',
      },
    };
  }
}
