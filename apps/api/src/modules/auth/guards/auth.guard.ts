import { CanActivate, Injectable } from '@nestjs/common';

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(): boolean {
    // TODO: read signed session cookie, load session/user, and attach user to request.
    return true;
  }
}
