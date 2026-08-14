import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard';
import { StudentRoleGuard } from '../auth/guards/student-role.guard';
import type { PublicTeacherContactResponse } from './users.service';
import { UsersService } from './users.service';

@Controller('api/v1/student/teacher-contact')
@UseGuards(AuthGuard, StudentRoleGuard)
export class StudentTeacherContactController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  getTeacherContact(): Promise<PublicTeacherContactResponse> {
    return this.usersService.getPublicTeacherContact();
  }
}
