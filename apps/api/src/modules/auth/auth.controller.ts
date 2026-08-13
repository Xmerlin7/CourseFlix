import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { SessionsService } from '../sessions/sessions.service';
import { AuthService, OtpResponse } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { OtpRequestDto } from './dto/otp-request.dto';
import { OtpVerifyDto } from './dto/otp-verify.dto';
import { PasswordResetDto } from './dto/password-reset.dto';
import { PasswordResetRequestDto } from './dto/password-reset-request.dto';
import { AuthGuard } from './guards/auth.guard';
import type { AuthenticatedUser } from './interfaces/authenticated-user.interface';
import { RegisterDto } from './dto/register.dto';

const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME ?? 'courseflix.sid';
const COOKIE_SECURE = process.env.COOKIE_SECURE === 'true';
const COOKIE_SAME_SITE = (process.env.COOKIE_SAME_SITE ?? 'lax') as
  'lax' | 'strict' | 'none';

@Controller('api/v1')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly sessionsService: SessionsService,
  ) {}

  @Post('auth/login')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ThrottlerGuard)
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<{ user: AuthenticatedUser }> {
    const result = await this.authService.login(loginDto);

    response.cookie(SESSION_COOKIE_NAME, result.token, {
      httpOnly: true,
      secure: COOKIE_SECURE,
      sameSite: COOKIE_SAME_SITE,
      signed: true,
      maxAge: result.maxAgeMs,
    });

    return { user: result.user };
  }

  @Post('auth/otp/request')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ThrottlerGuard)
  async requestOtp(@Body() dto: OtpRequestDto): Promise<OtpResponse> {
    return this.authService.requestOtp(dto.email, dto.purpose);
  }

  @Post('auth/otp/verify')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ThrottlerGuard)
  async verifyOtp(
    @Body() dto: OtpVerifyDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<{ user: AuthenticatedUser }> {
    const { token, maxAgeMs, user } = await this.authService.verifyOtp(dto);

    response.cookie(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: COOKIE_SECURE,
      sameSite: COOKIE_SAME_SITE,
      signed: true,
      maxAge: maxAgeMs,
    });

    return { user };
  }

  @Post('auth/password/request')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ThrottlerGuard)
  async requestPasswordReset(
    @Body() dto: PasswordResetRequestDto,
  ): Promise<OtpResponse> {
    return this.authService.requestPasswordReset(dto.email);
  }

  @Post('auth/password/reset')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ThrottlerGuard)
  async resetPassword(
    @Body() dto: PasswordResetDto,
  ): Promise<{ success: true }> {
    await this.authService.resetPassword(dto);
    return { success: true };
  }

  @Post('auth/logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<{ success: true }> {
    const token = request.signedCookies?.[SESSION_COOKIE_NAME] as
      string | undefined;
    await this.authService.logout(token);

    response.clearCookie(SESSION_COOKIE_NAME, {
      httpOnly: true,
      secure: COOKIE_SECURE,
      sameSite: COOKIE_SAME_SITE,
    });

    return { success: true };
  }

  @Get('me')
  @UseGuards(AuthGuard)
  getMe(@CurrentUser() user: AuthenticatedUser): AuthenticatedUser {
    return user;
  }

  // Settings > Security "sign out of other devices" — revokes every
  // active session for this user except the one making the request.
  @Post('auth/sessions/revoke-others')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(AuthGuard)
  async revokeOtherSessions(
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: Request,
  ): Promise<void> {
    const token = request.signedCookies?.[SESSION_COOKIE_NAME] as
      string | undefined;
    if (!token) {
      return;
    }
    await this.sessionsService.revokeAllExcept(user.id, token);
  }

  // Verification OTP is issued (not consumed) here; the account is only
  // activated once the user redeems it via POST /auth/otp/verify with
  // purpose 'register'.
  @Post('auth/register')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(ThrottlerGuard) // public endpoint — rate limited
  async register(@Body() dto: RegisterDto): Promise<OtpResponse> {
    return this.authService.register(dto);
  }
}
