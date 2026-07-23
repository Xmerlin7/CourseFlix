import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { SessionsService } from '../../sessions/sessions.service';
import { AuthenticatedUser } from '../interfaces/authenticated-user.interface';

const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME ?? 'courseflix.sid';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly sessionsService: SessionsService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: AuthenticatedUser }>();

    const token = request.signedCookies?.[SESSION_COOKIE_NAME] as string | undefined;
    if (!token) {
      throw new UnauthorizedException('Not authenticated.');
    }

    const session = await this.sessionsService.findActiveSession(token);
    if (!session) {
      throw new UnauthorizedException('Not authenticated.');
    }

    request.user = {
      id: session.user.id,
      email: session.user.email,
      role: session.user.role,
    };

    return true;
  }
}