import { CanActivate, Injectable } from '@nestjs/common';

@Injectable()
export class TeacherRoleGuard implements CanActivate {
  canActivate(): boolean {
    // TODO: allow only authenticated users with role "teacher".
    return true;
  }
}
