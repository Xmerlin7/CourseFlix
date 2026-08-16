import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as argon2 from 'argon2';
import { OtpService } from '../otp/otp.service';
import { SessionsService } from '../sessions/sessions.service';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { OtpVerifyDto } from './dto/otp-verify.dto';
import { PasswordResetDto } from './dto/password-reset.dto';
import { AuthenticatedUser } from './interfaces/authenticated-user.interface';
import { RegisterDto } from './dto/register.dto';
import type { UserEntity } from '../users/entities/user.entity';

export interface LoginResult {
  token: string;
  maxAgeMs: number;
  user: AuthenticatedUser;
}

// What the Google OAuth callback receives when the account really exists but
// a one-time-code step is required before any session is opened. No cookie
// and no session are created at this stage — the user redeems the code via
// POST /auth/otp/verify (purpose 'google_oauth') and that call signs them in.
export interface GoogleOtpRequired {
  requiresOtp: true;
  email: string;
  devCode?: string;
}

// Shape a Google profile must satisfy before we'll sign someone in. Both
// the OAuth exchange and the email-verified check are server-side — the
// client can't forge these values.
export interface GoogleProfile {
  id: string;
  email: string;
  verifiedEmail: boolean;
  fullName: string;
  avatarUrl?: string | null;
}

// Response shape shared by every flow that emails an OTP. `devCode` is only
// present when email delivery did NOT actually happen (unconfigured OR a
// failed send) AND we're not in production — once mail is genuinely
// delivered the code never leaves the server. The `accountStatus` field is
// only set for the register flow (where the user has already proven they
// own the email), so the client can tell "code sent" from "account already
// active".
export interface OtpResponse {
  message: string;
  email: string;
  devCode?: string;
  accountStatus?: 'pending' | 'active' | 'unknown';
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly sessionsService: SessionsService,
    private readonly otpService: OtpService,
  ) {}

  async login(loginDto: LoginDto): Promise<LoginResult> {
    const user = await this.usersService.findByEmail(loginDto.email);

    if (!user || user.status !== 'active') {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const passwordMatches =
      user.passwordHash !== null &&
      (await argon2.verify(user.passwordHash, loginDto.password));
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    return this.buildLoginResult(user);
  }

  async logout(token: string | undefined): Promise<void> {
    if (!token) {
      return;
    }
    await this.sessionsService.revokeSession(token);
  }

  /**
   * Google "Continue with Google" sign-in. The Google email is already
   * verified, so an account is created active (student role, no password)
   * on first use, linked to the existing account when the same email is
   * already registered — but signing in is never immediate: a one-time
   * password is mailed (purpose 'google_oauth') and must be redeemed via
   * `verifyOtp` before a session is opened.
   */
  async loginViaGoogle(
    profile: GoogleProfile,
  ): Promise<LoginResult | GoogleOtpRequired> {
    if (!profile.email || !profile.verifiedEmail) {
      throw new UnauthorizedException(
        'Your Google account has no verified email address.',
      );
    }

    // Already linked to this Google account.
    const byGoogle = await this.usersService.findByGoogleId(profile.id);
    if (byGoogle) {
      if (byGoogle.status !== 'active') {
        throw new UnauthorizedException('Account is suspended.');
      }
      return this.issueGoogleOtp(byGoogle);
    }

    const normalizedEmail = profile.email.trim().toLowerCase();

    // Same email registered earlier via password — link it up. If that
    // account was still pending email verification, Google's proof of the
    // email activates it.
    const byEmail = await this.usersService.findByEmail(normalizedEmail);
    if (byEmail) {
      if (byEmail.status === 'suspended') {
        throw new UnauthorizedException('Account is suspended.');
      }
      if (!byEmail.googleId) {
        await this.usersService.linkGoogleId(byEmail.id, profile.id);
        byEmail.googleId = profile.id;
      }
      if (byEmail.status === 'inactive' || !byEmail.emailVerifiedAt) {
        await this.usersService.markEmailVerified(byEmail.id);
        byEmail.status = 'active';
        byEmail.emailVerifiedAt = new Date();
      }
      return this.issueGoogleOtp(byEmail);
    }

    // First time on the platform — create an active, verified account.
    const created = await this.usersService.createOAuthUser(
      profile.fullName || normalizedEmail,
      normalizedEmail,
      profile.id,
      profile.avatarUrl ?? null,
    );
    return this.issueGoogleOtp(created);
  }

  /**
   * Email verification on register: the account is created as 'inactive'
   * (password login refuses to authenticate it) and a register OTP is sent.
   * No session is issued here — the user verifies via `verifyOtp` with
   * purpose 'register', which flips them to active and logs them in.
   */
  async register(dto: RegisterDto): Promise<OtpResponse> {
    const existingUser = await this.usersService.findByEmail(dto.email);
    if (existingUser) {
      throw new ConflictException('Email already in use.');
    }

    const passwordHash = await argon2.hash(dto.password);
    const newUser = await this.usersService.createUser(
      dto.fullName,
      dto.email,
      passwordHash,
      'inactive', // Activation gated behind email verification.
      'student', // Default role for new registrations
    );

    const { code, delivered } = await this.otpService.issue(
      newUser.id,
      newUser.email,
      'register',
    );

    return {
      message:
        'Registration successful. Check your email for your verification code.',
      email: newUser.email,
      accountStatus: 'pending' as const,
      ...this.devCode(code, delivered),
    };
  }

  /**
   * Re-sends an OTP for a flow that already mailed one: 'register' for an
   * unverified registration, 'google_oauth' after the Google callback.
   */
  async requestOtp(
    email: string,
    purpose: 'register' | 'google_oauth',
  ): Promise<OtpResponse> {
    const user = await this.usersService.findByEmail(email);

    if (purpose === 'register') {
      // Resend the email-verification code to a registration that hasn't
      // been verified yet. Generic success for unknown AND already-active
      // accounts so this endpoint can't enumerate registered emails — only
      // the pending-verification case ever produces a code.
      if (!user || user.status !== 'inactive') {
        return {
          message: 'Check your email for your verification code.',
          email: email.trim().toLowerCase(),
          accountStatus:
            user && user.status === 'active'
              ? ('active' as const)
              : ('unknown' as const),
        };
      }
      const { code, delivered } = await this.otpService.issue(
        user.id,
        user.email,
        'register',
      );
      return {
        message: 'Check your email for your verification code.',
        email: user.email,
        accountStatus: 'pending' as const,
        ...this.devCode(code, delivered),
      };
    }

    // purpose === 'google_oauth'. Resend after the Google callback already
    // mailed a code. Same generic response for unknown/inactive accounts so
    // the endpoint can't be used to enumerate registered emails — only an
    // active account gets a code.
    if (user && user.status === 'active') {
      const { code, delivered } = await this.otpService.issue(
        user.id,
        user.email,
        'google_oauth',
      );
      return {
        message: 'Check your email for your Google sign-in code.',
        email: user.email,
        ...this.devCode(code, delivered),
      };
    }

    return {
      message: 'Check your email for your Google sign-in code.',
      email: email.trim().toLowerCase(),
    };
  }

  /**
   * Redeems an OTP. For purpose 'google_oauth' it completes the Google
   * sign-in that paused at a code; for purpose 'register' it verifies the
   * account email, activates the user, then authenticates. A session is
   * issued and returned either way.
   */
  async verifyOtp(dto: OtpVerifyDto): Promise<LoginResult> {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid or expired code.');
    }

    if (dto.purpose === 'google_oauth' && user.status !== 'active') {
      throw new UnauthorizedException('Invalid or expired code.');
    }

    await this.otpService.verify(user.id, dto.purpose, dto.code);

    if (dto.purpose === 'register' && !user.emailVerifiedAt) {
      await this.usersService.markEmailVerified(user.id);
      user.status = 'active';
      user.emailVerifiedAt = new Date();
    }

    return this.buildLoginResult(user);
  }

  /** Forgot password step 1: emails a reset OTP to an active account. */
  async requestPasswordReset(email: string): Promise<OtpResponse> {
    const user = await this.usersService.findByEmail(email);

    if (user && user.status === 'active') {
      const { code, delivered } = await this.otpService.issue(
        user.id,
        user.email,
        'password_reset',
      );
      return {
        message: 'Check your email for your password reset code.',
        email: user.email,
        ...this.devCode(code, delivered),
      };
    }

    return {
      message: 'Check your email for your password reset code.',
      email: email.trim().toLowerCase(),
    };
  }

  /** Forgot password step 2: verifies the reset OTP and sets a new hash. */
  async resetPassword(dto: PasswordResetDto): Promise<void> {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user || user.status !== 'active') {
      throw new UnauthorizedException('Invalid or expired code.');
    }

    await this.otpService.verify(user.id, 'password_reset', dto.code);
    await this.usersService.updatePasswordHash(
      user.id,
      await argon2.hash(dto.newPassword),
    );
  }

  // Minimal shape — accepts a full UserEntity, a Google-created OAuth user
  // (whose passwordHash is null), etc., as long as the fields the client
  // needs are present.
  private async buildLoginResult(
    user: Pick<
      UserEntity,
      | 'id'
      | 'email'
      | 'role'
      | 'fullName'
      | 'avatarUrl'
      | 'whatsappNumber'
      | 'managedByTeacherId'
    >,
  ): Promise<LoginResult> {
    const { token, session } = await this.sessionsService.createSession(
      user.id,
    );

    return {
      token,
      maxAgeMs: session.expiresAt.getTime() - Date.now(),
      user: this.toAuthenticatedUser(user),
    };
  }

  private toAuthenticatedUser(
    user: Pick<
      UserEntity,
      | 'id'
      | 'email'
      | 'role'
      | 'fullName'
      | 'avatarUrl'
      | 'whatsappNumber'
      | 'managedByTeacherId'
    >,
  ): AuthenticatedUser {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
      avatarUrl: user.avatarUrl,
      whatsappNumber: user.whatsappNumber,
      managedByTeacherId: user.managedByTeacherId,
    };
  }

  // Gated on `delivered`, not on whether Resend is configured — a
  // configured-but-failing key (revoked, unverified sender domain, Resend
  // down) must fall back to devCode exactly like being unconfigured does,
  // or the code becomes unreachable: not emailed, and not returned either.
  private devCode(code: string, delivered: boolean): { devCode: string } | {} {
    if (process.env.NODE_ENV === 'production') {
      return {};
    }
    if (delivered) {
      return {};
    }
    return { devCode: code };
  }

  // Shared sink for every branch of `loginViaGoogle`: mail a one-time code
  // for the existing/just-created account and report that a code step is
  // required instead of handing back a session.
  private async issueGoogleOtp(
    user: Pick<UserEntity, 'id' | 'email'>,
  ): Promise<GoogleOtpRequired> {
    const { code, delivered } = await this.otpService.issue(
      user.id,
      user.email,
      'google_oauth',
    );
    return {
      requiresOtp: true,
      email: user.email,
      ...this.devCode(code, delivered),
    };
  }
}
