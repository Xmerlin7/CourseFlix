// apps/api/src/modules/auth/guards/auth.guard.spec.ts
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { AuthGuard } from './auth.guard';
import { SessionsService } from '../../sessions/sessions.service';
import { AuthenticatedUser } from '../interfaces/authenticated-user.interface';

type RequestWithUser = Request & { user?: AuthenticatedUser };

function createContext(signedCookies: Record<string, string>) {
  const request = { signedCookies } as RequestWithUser;
  const context = {
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;

  return { context, request };
}

describe('AuthGuard', () => {
  let sessionsService: { findActiveSession: jest.Mock };
  let guard: AuthGuard;

  beforeEach(() => {
    sessionsService = { findActiveSession: jest.fn() };
    guard = new AuthGuard(sessionsService as unknown as SessionsService);
  });

  it('rejects a request with no session cookie', async () => {
    const { context } = createContext({});
    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });

  it('rejects a request with an expired or unknown session', async () => {
    sessionsService.findActiveSession.mockResolvedValue(null);
    const { context } = createContext({ 'courseflix.sid': 'stale-token' });

    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });

  it('attaches the authenticated user and allows the request through', async () => {
    sessionsService.findActiveSession.mockResolvedValue({
      user: { id: 'user-1', email: 'student@courseflix.local', role: 'student' },
    });
    const { context, request } = createContext({ 'courseflix.sid': 'valid-token' });

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(request.user).toEqual({
      id: 'user-1',
      email: 'student@courseflix.local',
      role: 'student',
    });
  });
});