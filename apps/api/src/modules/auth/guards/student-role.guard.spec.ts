// apps/api/src/modules/auth/guards/student-role.guard.spec.ts
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import type { Request } from 'express';
import { StudentRoleGuard } from './student-role.guard';
import { AuthenticatedUser } from '../interfaces/authenticated-user.interface';

type RequestWithUser = Request & { user?: AuthenticatedUser };

function createContext(user?: AuthenticatedUser): ExecutionContext {
  const request = { user } as RequestWithUser;
  return {
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

describe('StudentRoleGuard', () => {
  const guard = new StudentRoleGuard();

  it('allows a student through', () => {
    const context = createContext({ id: '1', email: 's@courseflix.local', role: 'student' });
    expect(guard.canActivate(context)).toBe(true);
  });

  it('rejects a teacher', () => {
    const context = createContext({ id: '2', email: 't@courseflix.local', role: 'teacher' });
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('rejects a request with no authenticated user', () => {
    const context = createContext(undefined);
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
});