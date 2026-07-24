import { CanActivate, Injectable } from '@nestjs/common';

@Injectable()
export class StudentRoleGuard implements CanActivate {
  canActivate(): boolean {
    // TODO: allow only authenticated users with role "student".
    return true;
  }
}
