import {
  CallHandler,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, from } from 'rxjs';
import type { Request } from 'express';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { findActionDefinition } from './assistant-action.registry';
import { AssistantActionsService } from './assistant-actions.service';

/** Methods that change state. Reads pass through untouched. */
const WRITE_METHODS = new Set(['POST', 'PATCH', 'PUT', 'DELETE']);

/**
 * Parks assistant writes instead of executing them.
 *
 * Applied to the controllers an assistant can reach on the teacher
 * surface. For anyone else — the teacher themselves, an admin — it is a
 * pass-through. For an assistant it stops the handler from ever running,
 * records the request, and answers 202 with the parked row, so the client
 * can tell the assistant their change is awaiting review.
 *
 * Being an interceptor rather than a check inside each service matters:
 * a service-level check has to be remembered at every call site, and the
 * one that gets forgotten is the one that silently writes. Here the
 * default for an assistant is "nothing runs".
 */
@Injectable()
export class PendingApprovalInterceptor implements NestInterceptor {
  constructor(private readonly actions: AssistantActionsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<
      Request & {
        user?: AuthenticatedUser;
        // Set by Express' router: the pattern, not the concrete URL.
        route?: { path?: string };
      }
    >();

    const user = request.user;
    if (!user || user.role !== 'assistant') {
      return next.handle();
    }
    if (!WRITE_METHODS.has(request.method)) {
      return next.handle();
    }

    const routeKey = `${request.method} ${this.routePattern(request)}`;
    const definition = findActionDefinition(routeKey);

    if (!definition) {
      // Deliberately a refusal, not a pass-through. An assistant-reachable
      // write with no registry entry cannot be replayed after approval, so
      // letting it run would be the one path that skips review entirely.
      // File uploads land here on purpose: the payload is multipart and
      // there is nowhere to park the bytes, so an assistant cannot upload.
      throw new ForbiddenException(
        'هذا الإجراء غير متاح للمساعد حاليًا — تواصل مع المعلم لتنفيذه.',
      );
    }

    // `managedByTeacherId` is guaranteed by the assistant role invariant
    // (see scope-teacher-id.ts), but an assistant row with no teacher
    // would otherwise park actions nobody can ever review.
    const teacherId = user.managedByTeacherId;
    if (!teacherId) {
      throw new ForbiddenException(
        'حسابك غير مرتبط بمعلم — تواصل مع مسؤول المنصة.',
      );
    }

    const params = (request.params ?? {}) as Record<string, string>;
    const body = (request.body ?? {}) as Record<string, unknown>;

    return from(
      this.actions.park({
        assistantId: user.id,
        assistantName: user.fullName,
        teacherId,
        routeKey,
        params,
        body,
        summary: definition.describe({ params, body }),
      }),
    );
  }

  /**
   * Express exposes the matched pattern on `req.route.path`, but only
   * relative to the controller's own mount point — the global prefix and
   * the controller's `@Controller()` path are stripped. `baseUrl` carries
   * exactly that prefix, so the two together rebuild the key the registry
   * is written in.
   */
  private routePattern(
    request: Request & { route?: { path?: string } },
  ): string {
    const tail = request.route?.path ?? '';
    const base = request.baseUrl ?? '';
    const joined = `${base}${tail === '/' ? '' : tail}`;
    return joined.endsWith('/') ? joined.slice(0, -1) : joined;
  }
}
