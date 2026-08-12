import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import type { Request } from 'express';
import { AuthenticatedUser } from '../interfaces/authenticated-user.interface';

// This is a single-teacher platform with no separate "support" role in
// the actual (as opposed to schemaV2.sql-only) role model — admins and
// the teacher's own assistants are who this product intends to handle
// support tickets, so the ticket ownership/triage surface is gated to
// those three roles instead of inventing a new one. The teacher can
// still see the inbox (useful for a small course), but isn't the only
// one who can act on it.
@Injectable()
export class SupportStaffRoleGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: AuthenticatedUser }>();

    const role = request.user?.role;
    if (role !== 'admin' && role !== 'teacher' && role !== 'assistant') {
      throw new ForbiddenException('Support staff only.');
    }

    return true;
  }
}
