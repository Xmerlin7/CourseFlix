import { Injectable, Logger } from '@nestjs/common';
import type { OtpPurpose } from '../otp/entities/otp-code.entity';

const OTP_SUBJECTS: Record<OtpPurpose, { en: string; ar: string }> = {
  login: {
    en: 'Your CourseFlix login code',
    ar: 'رمز تسجيل الدخول إلى كورس فلاكس',
  },
  register: {
    en: 'Verify your CourseFlix email',
    ar: 'تأكيد بريدك الإلكتروني في كورس فلاكس',
  },
  password_reset: {
    en: 'Reset your CourseFlix password',
    ar: 'إعادة تعيين كلمة مرور كورس فلاكس',
  },
  google_oauth: {
    en: 'Confirm your CourseFlix Google sign-in',
    ar: 'تأكيد تسجيل الدخول عبر جوجل في كورس فلاكس',
  },
};

/**
 * Sends transactional email through the Resend HTTP API (no SDK dependency —
 * the rest of the app already talks to external APIs with plain fetch).
 *
 * When RESEND_API_KEY is unset or left as the `replace-me` placeholder the
 * mail is not sent; the code is logged instead so local dev still works
 * (same fallback philosophy as MockEmbeddingProvider for embeddings). The
 * OTP controllers additionally echo the code as `devCode` when
 * NODE_ENV !== 'production', so a developer can read it straight from the
 * API response.
 */
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  isConfigured(): boolean {
    const apiKey = process.env.RESEND_API_KEY;
    return Boolean(apiKey && apiKey !== 'replace-me');
  }

  async sendOtp(to: string, code: string, purpose: OtpPurpose): Promise<void> {
    const apiKey = process.env.RESEND_API_KEY;
    if (!this.isConfigured()) {
      this.logger.warn(
        `RESEND_API_KEY not configured — OTP for ${to} (${purpose}): ${code}`,
      );
      return;
    }

    const from =
      process.env.EMAIL_FROM ?? 'CourseFlix <noreply@courseflix.local>';
    const subject = OTP_SUBJECTS[purpose];

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject: subject.en,
        html: this.renderOtpHtml(code, purpose),
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      this.logger.error(
        `Resend send failed (${response.status}): ${errorText}`,
      );
      throw new Error(
        `Failed to send email (status ${response.status}): ${errorText}`,
      );
    }
  }

  private renderOtpHtml(code: string, purpose: OtpPurpose): string {
    const subject = OTP_SUBJECTS[purpose];
    return `
      <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; color: #1a1a1a;">
        <h2>${subject.ar}</h2>
        <p>استخدم الرمز التالي لإتمام العملية. الرمز صالح لمدة 10 دقائق.</p>
        <p style="font-size: 28px; font-weight: bold; letter-spacing: 6px; text-align: center; padding: 16px; background: #f5f5f5; border-radius: 8px;">${code}</p>
        <p>Use this code to complete your action. It expires in 10 minutes.</p>
      </div>
    `;
  }
}
