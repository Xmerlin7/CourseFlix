import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash, randomBytes } from 'crypto';
import { Repository } from 'typeorm';
import { SessionEntity } from './entities/session.entity';

export interface CreatedSession {
  token: string;
  session: SessionEntity;
}

@Injectable()
export class SessionsService {
  constructor(
    @InjectRepository(SessionEntity)
    private readonly sessionsRepository: Repository<SessionEntity>,
  ) {}

  async createSession(userId: string): Promise<CreatedSession> {
    // Opaque, server-generated token — only its hash is ever persisted.
    const token = randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(token);
    const ttlDays = Number(process.env.SESSION_TTL_DAYS ?? 7);
    const expiresAt = new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000);

    const session = this.sessionsRepository.create({
      userId,
      tokenHash,
      expiresAt,
    });
    await this.sessionsRepository.save(session);

    return { token, session };
  }

  async revokeSession(token: string): Promise<void> {
    const tokenHash = this.hashToken(token);
    await this.sessionsRepository.update(
      { tokenHash },
      { revokedAt: new Date() },
    );
  }

  async findActiveSession(token: string): Promise<SessionEntity | null> {
    const tokenHash = this.hashToken(token);
    const session = await this.sessionsRepository.findOne({
      where: { tokenHash },
      relations: { user: true },
    });

    if (
      !session ||
      session.revokedAt ||
      session.expiresAt.getTime() <= Date.now()
    ) {
      return null;
    }

    return session;
  }

  private hashToken(token: string): string {
    // SHA-256 here on purpose, not Argon2 — this needs to be a fast,
    // deterministic lookup key for a DB query, not a slow password hash.
    return createHash('sha256').update(token).digest('hex');
  }
}
