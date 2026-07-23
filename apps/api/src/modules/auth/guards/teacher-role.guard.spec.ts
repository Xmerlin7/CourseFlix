// apps/api/src/modules/auth/guards/teacher-role.guard.spec.ts
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import type { Request } from 'express';
import { TeacherRoleGuard } from './teacher-role.guard';
import { AuthenticatedUser } from '../interfaces/authenticated-user.interface';

type RequestWithUser = Request & { user?: AuthenticatedUser };

function createContext(user?: AuthenticatedUser): ExecutionContext {
  const request = { user } as RequestWithUser;
  return {
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

describe('TeacherRoleGuard', () => {
  const guard = new TeacherRoleGuard();

  it('allows a teacher through', () => {
    const context = createContext({ id: '1', email: 't@courseflix.local', role: 'teacher' });
    expect(guard.canActivate(context)).toBe(true);
  });

  it('rejects a student', () => {
    const context = createContext({ id: '2', email: 's@courseflix.local', role: 'student' });
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('rejects a request with no authenticated user', () => {
    const context = createContext(undefined);
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
});