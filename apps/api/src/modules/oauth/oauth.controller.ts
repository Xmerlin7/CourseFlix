import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from '../auth/auth.service';
import { OAuthService } from './oauth.service';

const STATE_COOKIE_NAME = 'oauth.state';
const STATE_MAX_AGE_MS = 10 * 60 * 1000;
const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME ?? 'courseflix.sid';
const COOKIE_SECURE = process.env.COOKIE_SECURE === 'true';
const COOKIE_SAME_SITE = (process.env.COOKIE_SAME_SITE ?? 'lax') as
  'lax' | 'strict' | 'none';

@Controller('api/v1/auth/oauth')
export class OAuthController {
  constructor(
    private readonly oauthService: OAuthService,
    private readonly authService: AuthService,
  ) {}

  @Get('google')
  startGoogle(@Res() response: Response): void {
    this.assertConfigured();

    const state = this.oauthService.generateState();
    response.cookie(STATE_COOKIE_NAME, state, {
      httpOnly: true,
      secure: COOKIE_SECURE,
      sameSite: COOKIE_SAME_SITE,
      signed: true,
      maxAge: STATE_MAX_AGE_MS,
    });
    response.redirect(302, this.oauthService.getAuthorizationUrl(state));
  }

  @Get('google/callback')
  async googleCallback(
    @Query('code') code: string | undefined,
    @Query('state') state: string | undefined,
    @Query('error') error: string | undefined,
    @Req() request: Request,
    @Res() response: Response,
  ): Promise<void> {
    this.assertConfigured();

    const fail = (): void => {
      response.clearCookie(STATE_COOKIE_NAME, {
        httpOnly: true,
        secure: COOKIE_SECURE,
        sameSite: COOKIE_SAME_SITE,
      });
      response.redirect(
        302,
        `${this.oauthService.getRedirectBaseUrl()}/login?oauth=error`,
      );
    };

    // The state param proves this callback belongs to the redirect we
    // started — it bounces forged/failed flows back to the login page.
    const expectedState = request.signedCookies?.[STATE_COOKIE_NAME] as
      string | undefined;
    if (error || !code || !state || !expectedState || state !== expectedState) {
      fail();
      return;
    }

    try {
      const accessToken = await this.oauthService.exchangeCode(code);
      const profile = await this.oauthService.fetchProfile(accessToken);
      const result = await this.authService.loginViaGoogle(profile);

      response.clearCookie(STATE_COOKIE_NAME, {
        httpOnly: true,
        secure: COOKIE_SECURE,
        sameSite: COOKIE_SAME_SITE,
      });

      // Google identity is verified but a one-time code was mailed (and no
      // session opened) — send the browser to the login page's code step,
      // pre-filled with the account email. The user signs in by redeeming
      // the code via POST /auth/otp/verify (purpose 'google_oauth'). In dev
      // mode the just-issued code is also carried across so the developer
      // sees it right away (same `devCode` echo as every OTP endpoint).
      if ('requiresOtp' in result) {
        const params = new URLSearchParams({
          oauth: 'otp',
          email: result.email,
        });
        if (result.devCode) {
          params.set('devCode', result.devCode);
        }
        response.redirect(
          302,
          `${this.oauthService.getRedirectBaseUrl()}/login?${params.toString()}`,
        );
        return;
      }

      response.cookie(SESSION_COOKIE_NAME, result.token, {
        httpOnly: true,
        secure: COOKIE_SECURE,
        sameSite: COOKIE_SAME_SITE,
        signed: true,
        maxAge: result.maxAgeMs,
      });
      response.redirect(
        302,
        `${this.oauthService.getRedirectBaseUrl()}/login?oauth=success`,
      );
    } catch (caught) {
      this.logFail(caught);
      fail();
    }
  }

  private assertConfigured(): void {
    if (!this.oauthService.isConfigured()) {
      throw new HttpException(
        'Google sign-in is not configured on this server yet.',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  private logFail(caught: unknown): void {
    if (caught instanceof Error) {
      // request logger anyway; keep it explicit for OAuth debugging.
      console.error('Google sign-in failed:', caught.message);
    }
  }
}
