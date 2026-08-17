import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as argon2 from 'argon2';
import { randomInt } from 'crypto';
import { IsNull, Repository } from 'typeorm';
import { MailService } from '../mail/mail.service';
import { OtpCodeEntity, OtpPurpose } from './entities/otp-code.entity';

const CODE_TTL_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;

/**
 * Issues and verifies single-use, expiring one-time password codes.
 *
 * - Codes are 6 random digits; only their argon2 hash is stored.
 * - Every issued code stays redeemable until it's consumed or expires —
 *   requesting a new code does NOT invalidate an older one it already sent.
 *   (A user who registered, then clicked "resend", still needs the first
 *   code to work; only a consumed or expired code stops working.)
 * - A code dies on success, on expiry, or after MAX_ATTEMPTS failed tries.
 */
@Injectable()
export class OtpService {
  constructor(
    @InjectRepository(OtpCodeEntity)
    private readonly otpRepository: Repository<OtpCodeEntity>,
    private readonly mailService: MailService,
  ) {}

  /**
   * Issues a new code for the user and emails it.
   *
   * The code is persisted first and mailed second, so a delivery failure
   * (see MailService.sendOtp) never loses the code — it's already valid
   * and verifiable, just not delivered. `delivered` tells the caller
   * whether the email actually went out, so it can fall back to `devCode`
   * outside production when it didn't.
   */
  async issue(
    userId: string,
    email: string,
    purpose: OtpPurpose,
  ): Promise<{ code: string; delivered: boolean }> {
    const code = randomInt(0, 1_000_000).toString().padStart(6, '0');
    const codeHash = await argon2.hash(code);

    await this.otpRepository.save(
      this.otpRepository.create({
        userId,
        purpose,
        codeHash,
        expiresAt: new Date(Date.now() + CODE_TTL_MS),
      }),
    );

    const delivered = await this.mailService.sendOtp(email, code, purpose);
    return { code, delivered };
  }

  /** Throws unless `code` matches any of the user's unconsumed codes. */
  async verify(
    userId: string,
    purpose: OtpPurpose,
    code: string,
  ): Promise<void> {
    const records = await this.otpRepository.find({
      where: { userId, purpose, consumedAt: IsNull() },
      order: { createdAt: 'DESC' },
    });

    if (records.length === 0) {
      throw new UnauthorizedException('Invalid or expired code.');
    }

    const now = Date.now();

    // Retire codes that outlived their usefulness so the table can't grow
    // forever from repeated resends.
    for (const record of records) {
      if (
        record.expiresAt.getTime() <= now ||
        record.attempts >= MAX_ATTEMPTS
      ) {
        await this.consume(record.id);
      }
    }

    for (const record of records) {
      if (
        record.expiresAt.getTime() <= now ||
        record.attempts >= MAX_ATTEMPTS
      ) {
        continue;
      }
      const matches = await argon2.verify(record.codeHash, code);
      if (matches) {
        await this.consume(record.id);
        return;
      }
    }

    // No record matched. Count the failed attempt against the newest code
    // (the one the user most recently received).
    const newest = records[0];
    if (
      newest &&
      newest.expiresAt.getTime() > now &&
      newest.attempts < MAX_ATTEMPTS
    ) {
      await this.otpRepository.update(newest.id, {
        attempts: newest.attempts + 1,
      });
    }

    throw new UnauthorizedException('Invalid or expired code.');
  }

  private async consume(recordId: string): Promise<void> {
    await this.otpRepository.update(
      { id: recordId },
      { consumedAt: new Date() },
    );
  }
}
