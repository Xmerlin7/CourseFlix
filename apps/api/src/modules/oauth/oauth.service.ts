import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import type { GoogleProfile } from '../auth/auth.service';

const GOOGLE_AUTHORIZE_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo';

interface GoogleTokenResponse {
  access_token?: string;
  error?: string;
  error_description?: string;
}

interface GoogleUserInfoResponse {
  id?: string;
  email?: string;
  verified_email?: boolean;
  name?: string;
  picture?: string;
}

/**
 * "Continue with Google" (OAuth 2.0 authorization code flow), plain fetch —
 * same no-SDK philosophy as MailService. Config-driven: until
 * GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET hold real values the redirect
 * endpoints respond 503 so the button can never half-work.
 */
@Injectable()
export class OAuthService {
  private readonly logger = new Logger(OAuthService.name);

  isConfigured(): boolean {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    return Boolean(
      clientId &&
      clientSecret &&
      clientId !== 'replace-me' &&
      clientSecret !== 'replace-me',
    );
  }

  getAuthorizationUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID as string,
      redirect_uri: this.getCallbackUrl(),
      response_type: 'code',
      scope: 'openid email profile',
      prompt: 'select_account',
      state,
    });
    return `${GOOGLE_AUTHORIZE_URL}?${params.toString()}`;
  }

  async exchangeCode(code: string): Promise<string> {
    const response = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID as string,
        client_secret: process.env.GOOGLE_CLIENT_SECRET as string,
        redirect_uri: this.getCallbackUrl(),
        grant_type: 'authorization_code',
      }),
    });

    const tokens = (await response.json()) as GoogleTokenResponse;
    if (!response.ok || !tokens.access_token) {
      this.logger.error(
        `Google token exchange failed (${response.status}): ${tokens.error_description ?? tokens.error}`,
      );
      throw new ServiceUnavailableException(
        'Could not complete Google sign-in. Please try again.',
      );
    }
    return tokens.access_token;
  }

  async fetchProfile(accessToken: string): Promise<GoogleProfile> {
    const response = await fetch(GOOGLE_USERINFO_URL, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      this.logger.error(
        `Google userinfo failed (${response.status}): ${await response.text()}`,
      );
      throw new ServiceUnavailableException(
        'Could not complete Google sign-in. Please try again.',
      );
    }

    const info = (await response.json()) as GoogleUserInfoResponse;
    if (!info.id) {
      throw new ServiceUnavailableException(
        'Could not complete Google sign-in. Please try again.',
      );
    }

    return {
      id: info.id,
      email: info.email ?? '',
      verifiedEmail: Boolean(info.verified_email),
      fullName: info.name ?? '',
      avatarUrl: info.picture ?? null,
    };
  }

  generateState(): string {
    return randomBytes(24).toString('hex');
  }

  getCallbackUrl(): string {
    return (
      process.env.GOOGLE_CALLBACK_URL ??
      'http://localhost:3000/api/v1/auth/oauth/google/callback'
    );
  }

  /** Where the browser is sent back to after the OAuth dance. */
  getRedirectBaseUrl(): string {
    return (
      process.env.OAUTH_REDIRECT_URL ??
      process.env.WEB_ORIGIN ??
      'http://localhost:5173'
    );
  }
}
