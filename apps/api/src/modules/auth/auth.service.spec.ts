import { UnauthorizedException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as argon2 from 'argon2';
import { OtpService } from '../otp/otp.service';
import { SessionsService } from '../sessions/sessions.service';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: { findByEmail: jest.Mock; createUser: jest.Mock };
  let sessionsService: {
    createSession: jest.Mock;
    revokeSession: jest.Mock;
    findActiveSession: jest.Mock;
  };
  let otpService: { issue: jest.Mock; verify: jest.Mock };

  const activeUser = {
    id: 'user-1',
    email: 'student@courseflix.local',
    role: 'student' as const,
    status: 'active' as const,
    fullName: 'Abdullah Habseh',
    avatarUrl: null,
    managedByTeacherId: null,
  };

  beforeEach(async () => {
    usersService = { findByEmail: jest.fn(), createUser: jest.fn() };
    sessionsService = {
      createSession: jest.fn(),
      revokeSession: jest.fn(),
      findActiveSession: jest.fn(),
    };
    otpService = { issue: jest.fn(), verify: jest.fn() };

    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: SessionsService, useValue: sessionsService },
        { provide: OtpService, useValue: otpService },
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
      fullName: activeUser.fullName,
      avatarUrl: activeUser.avatarUrl,
      managedByTeacherId: activeUser.managedByTeacherId,
    });
    expect(sessionsService.createSession).toHaveBeenCalledWith(activeUser.id);
  });

  it('rejects a wrong password with a generic error', async () => {
    const passwordHash = await argon2.hash('Student123!');
    usersService.findByEmail.mockResolvedValue({ ...activeUser, passwordHash });

    await expect(
      authService.login({
        email: activeUser.email,
        password: 'wrong-password',
      }),
    ).rejects.toThrow(UnauthorizedException);
    expect(sessionsService.createSession).not.toHaveBeenCalled();
  });

  it('rejects an unknown email with the same generic error', async () => {
    usersService.findByEmail.mockResolvedValue(null);

    await expect(
      authService.login({
        email: 'nobody@courseflix.local',
        password: 'whatever',
      }),
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

  it('register creates a pending user and emails a verification code', async () => {
    // Registration is two-step now: the account is created 'inactive' and a
    // register OTP is mailed — no session is opened until it's redeemed via
    // verifyOtp (see the 'verifyOtp' tests below), so no createSession call
    // to mock here.
    usersService.findByEmail.mockResolvedValue(null);
    usersService.createUser.mockResolvedValue({
      id: 'new-user',
      email: 'new@test.com',
      role: 'student',
      fullName: 'New User',
      avatarUrl: null,
      managedByTeacherId: null,
    });
    otpService.issue.mockResolvedValue({ code: '123456', delivered: false });

    const result = await authService.register({
      fullName: 'New User',
      email: 'NEW@TEST.COM',
      password: 'StrongPass1',
      acceptedTerms: true,
    });

    expect(result.accountStatus).toBe('pending');
    expect(result.email).toBe('new@test.com');
    expect(result.devCode).toBe('123456');
    expect(usersService.createUser).toHaveBeenCalled();
    expect(otpService.issue).toHaveBeenCalledWith(
      'new-user',
      'new@test.com',
      'register',
    );
  });

  it('register rejects duplicate email', async () => {
    usersService.findByEmail.mockResolvedValue({
      id: 'existing',
      email: 'existing@test.com',
    });
    await expect(
      authService.register({
        fullName: 'Duplicate',
        email: 'existing@test.com',
        password: 'StrongPass1',
        acceptedTerms: true,
      }),
    ).rejects.toThrow('Email already in use.');
  });
});
