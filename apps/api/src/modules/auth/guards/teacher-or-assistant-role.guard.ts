// teacher-or-assistant-role.guard.ts
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import type { Request } from 'express';
import { AuthenticatedUser } from '../interfaces/authenticated-user.interface';

// Gates the teacher's course/section/lesson/student surface to both the
// teacher and their assistants — assistants share that surface but are
// kept off anything payment-related (SalesController stays on the
// stricter TeacherRoleGuard, unchanged).
@Injectable()
export class TeacherOrAssistantRoleGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: AuthenticatedUser }>();

    const role = request.user?.role;
    if (role !== 'teacher' && role !== 'assistant') {
      throw new ForbiddenException('Teachers and assistants only.');
    }

    return true;
  }
}
