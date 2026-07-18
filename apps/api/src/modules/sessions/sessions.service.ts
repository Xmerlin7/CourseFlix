import { Injectable } from '@nestjs/common';

@Injectable()
export class SessionsService {
  createSession(userId: string) {
    return {
      TODO: 'Create opaque server-side session token and persist hashed token.',
      userId,
    };
  }

  revokeSession(sessionId: string) {
    return {
      TODO: 'Mark session revoked and prevent future use.',
      sessionId,
    };
  }

  findActiveSession(sessionToken: string) {
    return {
      TODO: 'Hash token, find unexpired session, and load its user.',
      sessionToken,
    };
  }
}
