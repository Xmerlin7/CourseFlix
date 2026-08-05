import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthGuard } from '../auth/guards/auth.guard';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { CoursesService } from './courses.service';

@Controller('api/v1/courses')
@UseGuards(AuthGuard)
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Get()
  listCatalog(@CurrentUser() user: AuthenticatedUser) {
    return this.coursesService.listCatalog(user);
  }

  @Get(':courseId')
  getCourseDetail(
    @Param('courseId') courseId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.coursesService.getCourseDetail(courseId, user);
  }
}
