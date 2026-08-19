import { Injectable, Logger } from '@nestjs/common';
import { createTransport, type Transporter } from 'nodemailer';
import type { OtpPurpose } from '../otp/entities/otp-code.entity';

const OTP_SUBJECTS: Record<OtpPurpose, { en: string; ar: string }> = {
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

// Gmail's own SMTP endpoint — the default host/port whenever SMTP_HOST isn't
// set explicitly, so a Gmail App Password (SMTP_USER + SMTP_PASSWORD) is all
// a developer needs to configure. Any other SMTP provider (a verified Resend/
// SendGrid/Brevo domain, a company mail server, etc.) works the same way by
// just setting SMTP_HOST/SMTP_PORT/SMTP_SECURE to match it.
const DEFAULT_SMTP_HOST = 'smtp.gmail.com';
const DEFAULT_SMTP_PORT = 465;

/**
 * Sends transactional email over SMTP via nodemailer.
 *
 * Defaults to Gmail: set SMTP_USER to a real Gmail address and SMTP_PASSWORD
 * to an App Password for that account (myaccount.google.com/apppasswords —
 * requires 2-Step Verification), and mail sends immediately with no domain
 * to own or verify. Gmail requires the `From` header to match the
 * authenticated account (or a configured "Send As" alias), so EMAIL_FROM
 * defaults to SMTP_USER unless overridden.
 *
 * When SMTP_USER/SMTP_PASSWORD are unset or left as the `replace-me`
 * placeholder, mail is not sent; the code is logged instead so local dev
 * still works (same fallback philosophy as MockEmbeddingProvider for
 * embeddings). The OTP controllers additionally echo the code as `devCode`
 * when NODE_ENV !== 'production' AND delivery didn't actually happen, so a
 * developer can still read it straight from the API response if needed.
 *
 * `sendOtp` never throws — bad credentials, a network hiccup, or the SMTP
 * server being unreachable would otherwise take the whole register/login/
 * reset request down with it (a 500, with the account or reset request
 * already half-created in the DB). The OTP itself was already persisted by
 * OtpService before this runs, so a delivery failure only means the *email*
 * didn't go out; the code is still valid. Returns whether delivery actually
 * happened, so callers know whether `devCode` is the only way the user will
 * see the code.
 */
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: Transporter | null = null;

  isConfigured(): boolean {
    const user = process.env.SMTP_USER;
    const password = process.env.SMTP_PASSWORD;
    return Boolean(
      user && password && user !== 'replace-me' && password !== 'replace-me',
    );
  }

  async sendOtp(
    to: string,
    code: string,
    purpose: OtpPurpose,
  ): Promise<boolean> {
    if (!this.isConfigured()) {
      this.logger.warn(
        `SMTP not configured — OTP for ${to} (${purpose}): ${code}`,
      );
      return false;
    }

    const from = process.env.EMAIL_FROM ?? process.env.SMTP_USER;
    const subject = OTP_SUBJECTS[purpose];

    try {
      await this.getTransporter().sendMail({
        from,
        to,
        subject: subject.en,
        html: this.renderOtpHtml(code, purpose),
      });
      return true;
    } catch (error) {
      this.logger.error(
        `SMTP send failed for ${to} (${purpose}): ${error instanceof Error ? error.message : String(error)} — OTP: ${code}`,
      );
      return false;
    }
  }

  // Built once and reused — nodemailer's transporter pools its SMTP
  // connection internally, so recreating it per send would throw that away
  // on every single email.
  private getTransporter(): Transporter {
    if (!this.transporter) {
      const port = Number(process.env.SMTP_PORT ?? DEFAULT_SMTP_PORT);
      this.transporter = createTransport({
        host: process.env.SMTP_HOST ?? DEFAULT_SMTP_HOST,
        port,
        // Defaults to whatever the default port implies (465 = implicit
        // TLS, anything else = STARTTLS) unless SMTP_SECURE says otherwise.
        secure: process.env.SMTP_SECURE
          ? process.env.SMTP_SECURE === 'true'
          : port === 465,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
        },
      });
    }
    return this.transporter;
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
