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
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { AuthGuard } from './guards/auth.guard';
import { AuthenticatedUser } from './interfaces/authenticated-user.interface';

const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME ?? 'courseflix.sid';
const COOKIE_SECURE = process.env.COOKIE_SECURE === 'true';
const COOKIE_SAME_SITE = (process.env.COOKIE_SAME_SITE ?? 'lax') as
  | 'lax'
  | 'strict'
  | 'none';

@Controller('api/v1')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('auth/login')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ThrottlerGuard)
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<{ user: AuthenticatedUser }> {
    const { token, maxAgeMs, user } = await this.authService.login(loginDto);

    response.cookie(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: COOKIE_SECURE,
      sameSite: COOKIE_SAME_SITE,
      signed: true,
      maxAge: maxAgeMs,
    });

    return { user };
  }

  @Post('auth/logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<{ success: true }> {
    const token = request.signedCookies?.[SESSION_COOKIE_NAME] as string | undefined;
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
}