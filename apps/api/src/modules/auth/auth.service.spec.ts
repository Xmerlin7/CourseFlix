import { UnauthorizedException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as argon2 from 'argon2';
import { SessionsService } from '../sessions/sessions.service';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: { findByEmail: jest.Mock };
  let sessionsService: {
    createSession: jest.Mock;
    revokeSession: jest.Mock;
    findActiveSession: jest.Mock;
  };

  const activeUser = {
    id: 'user-1',
    email: 'student@courseflix.local',
    role: 'student' as const,
    status: 'active' as const,
  };

  beforeEach(async () => {
    usersService = { findByEmail: jest.fn() };
    sessionsService = {
      createSession: jest.fn(),
      revokeSession: jest.fn(),
      findActiveSession: jest.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: SessionsService, useValue: sessionsService },
      ],
    }).compile();

    authService = moduleRef.get(AuthService);
  });

  it('logs in with correct credentials and creates a session', async () => {
    const passwordHash = await argon2.hash('Student123!');
    usersService.findByEmail.mockResolvedValue({ ...activeUser, passwordHash });
    sessionsService.createSession.mockResolvedValue({
      token: 'raw-token',
      session: { expiresAt: new Date(Date.now() + 60_000) },
    });

    const result = await authService.login({
      email: activeUser.email,
      password: 'Student123!',
    });

    expect(result.token).toBe('raw-token');
    expect(result.user).toEqual({
      id: activeUser.id,
      email: activeUser.email,
      role: activeUser.role,
    });
    expect(sessionsService.createSession).toHaveBeenCalledWith(activeUser.id);
  });

  it('rejects a wrong password with a generic error', async () => {
    const passwordHash = await argon2.hash('Student123!');
    usersService.findByEmail.mockResolvedValue({ ...activeUser, passwordHash });

    await expect(
      authService.login({ email: activeUser.email, password: 'wrong-password' }),
    ).rejects.toThrow(UnauthorizedException);
    expect(sessionsService.createSession).not.toHaveBeenCalled();
  });

  it('rejects an unknown email with the same generic error', async () => {
    usersService.findByEmail.mockResolvedValue(null);

    await expect(
      authService.login({ email: 'nobody@courseflix.local', password: 'whatever' }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('revokes the session on logout', async () => {
    await authService.logout('raw-token');
    expect(sessionsService.revokeSession).toHaveBeenCalledWith('raw-token');
  });

  it('does nothing on logout when there is no session cookie', async () => {
    await authService.logout(undefined);
    expect(sessionsService.revokeSession).not.toHaveBeenCalled();
  });
});