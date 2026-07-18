import { Controller, Get, Query } from '@nestjs/common';
import { StudentService } from './student.service';

@Controller('api/v1/student')
export class StudentController {
  constructor(private readonly studentService: StudentService) {}

  @Get('dashboard')
  getDashboard() {
    return this.studentService.getDashboard();
  }

  @Get('enrollments')
  getEnrollments(
    @Query('status') status?: string,
    @Query('gradeLevel') gradeLevel?: string,
  ) {
    return this.studentService.getEnrollments({ status, gradeLevel });
  }
}
