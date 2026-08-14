import { Controller, Get } from '@nestjs/common';
import type { PublicTeacherContactResponse } from './users.service';
import { UsersService } from './users.service';

@Controller('api/v1/public/teacher-contact')
export class PublicTeacherContactController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  getTeacherContact(): Promise<PublicTeacherContactResponse> {
    return this.usersService.getPublicTeacherContact();
  }
}
