import { Injectable, Logger } from '@nestjs/common';
import { createTransport, type Transporter } from 'nodemailer';
import { DataSource } from 'typeorm';
import {
  AgentOutcome,
  AgentReporter,
  LessonAgent,
  LessonAgentContext,
} from './agent-context';
import { AGENT_NAMES, LessonAgentKey } from './roster';

// Gmail's own SMTP endpoint — the same defaults `MailService` in the API
// uses for OTP mail, so a Gmail App Password (SMTP_USER + SMTP_PASSWORD)
// is all a developer needs to configure. Any other SMTP provider works
// the same way via SMTP_HOST/SMTP_PORT/SMTP_SECURE.
const DEFAULT_SMTP_HOST = 'smtp.gmail.com';
const DEFAULT_SMTP_PORT = 465;

/** The two optional agents whose output waits on the teacher's review. */
const REVIEWABLE_KEYS: readonly LessonAgentKey[] = ['handout', 'quizmaster'];

interface TeacherRecord {
  full_name: string;
  email: string;
}

interface StepSummaryRecord {
  agent_key: LessonAgentKey;
  status: string;
  headline: string | null;
}

const STATUS_LABELS: Record<string, string> = {
  completed: 'خلّص شغله',
  failed: 'وقف في مشكلة',
  skipped: 'متوقف من الإعدادات',
};

/**
 * Last agent, optional: emails the teacher a summary of the whole pass
 * when the crew finishes.
 *
 * It reuses the exact SMTP setup the API's OTP mail uses (SMTP_USER,
 * SMTP_PASSWORD, SMTP_HOST/PORT/SECURE, EMAIL_FROM — all read from the
 * root `.env`), so a working OTP setup means a working summary email
 * with zero extra configuration.
 *
 * Best-effort on purpose, like `MailService.sendOtp`: a missing or
 * misconfigured SMTP, an unreachable server, or a teacher without an
 * email on record ends the step gracefully with a clear headline instead
 * of failing the run — the in-app notification (`notifyTeacher`) is the
 * channel that must never break, this email is the bonus on top.
 */
@Injectable()
export class NotifierAgent implements LessonAgent {
  readonly key: LessonAgentKey = 'notifier';

  private readonly logger = new Logger(NotifierAgent.name);
  private transporter: Transporter | null = null;

  constructor(private readonly dataSource: DataSource) {}

  async run(
    context: LessonAgentContext,
    reporter: AgentReporter,
  ): Promise<AgentOutcome> {
    const teacher = await this.loadTeacher(context.course.teacher_id);
    if (!teacher?.email) {
      await reporter.note('مفيش إيميل مسجّل لحساب المدرس — الملخص مش هيتبعِت.');
      return {
        headline: 'مفيش إيميل للمدرس، فمبعتش الملخص.',
        output: { delivered: false, reason: 'no_teacher_email' },
      };
    }

    if (!this.isSmtpConfigured()) {
      await reporter.progress(
        100,
        'إعدادات SMTP مش متظبطة — الملخص اتسجل في اللوق.',
      );
      return {
        headline: 'إعدادات البريد مش متظبطة — الملخص اتحفظ في اللوق بس.',
        output: { delivered: false, reason: 'smtp_not_configured' },
      };
    }

    // Runs last in the roster, so every other step already holds its
    // verdict; the messenger's own row is still `running` and excluded.
    const steps = await this.loadRunSteps(context.run.id);
    const awaitingReview = steps.some(
      (step) =>
        REVIEWABLE_KEYS.includes(step.agent_key) && step.status === 'completed',
    );

    await reporter.progress(40, 'بلم شغل الفريق في ملخص واحد.');
    await this.sendSummaryEmail(context, teacher, steps, awaitingReview);
    await reporter.progress(100, 'الإيميل اتتبعِت لعنوان المدرس.');

    return {
      headline: 'بعتهولك إيميل فيه ملخص اللي الفريق عمله.',
      output: { delivered: true, to: teacher.email },
    };
  }

  // ── SMTP ──

  /**
   * Same placeholder convention as `MailService`: unset or `replace-me`
   * credentials mean "local dev" and the email is skipped, not failed —
   * that's how the OTP flow already behaves.
   */
  private isSmtpConfigured(): boolean {
    const user = process.env.SMTP_USER;
    const password = process.env.SMTP_PASSWORD;
    return Boolean(
      user && password && user !== 'replace-me' && password !== 'replace-me',
    );
  }

  // Built once and reused — nodemailer's transporter pools its SMTP
  // connection internally, so recreating it per send would throw that
  // away on every single email.
  private getTransporter(): Transporter {
    if (!this.transporter) {
      const port = Number(process.env.SMTP_PORT ?? DEFAULT_SMTP_PORT);
      this.transporter = createTransport({
        host: process.env.SMTP_HOST ?? DEFAULT_SMTP_HOST,
        port,
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

  private async sendSummaryEmail(
    context: LessonAgentContext,
    teacher: TeacherRecord,
    steps: StepSummaryRecord[],
    awaitingReview: boolean,
  ): Promise<void> {
    const from = process.env.EMAIL_FROM ?? process.env.SMTP_USER;
    const rows = steps
      .map(
        (step) => `
          <tr>
            <td style="padding: 10px 14px; border-bottom: 1px solid #eee; font-weight: 600; white-space: nowrap;">
              ${AGENT_NAMES[step.agent_key]}
            </td>
            <td style="padding: 10px 14px; border-bottom: 1px solid #eee; color: #555;">
              ${this.renderStatus(step)}
            </td>
          </tr>
        `,
      )
      .join('');

    await this.getTransporter().sendMail({
      from,
      to: teacher.email,
      subject: `ملخص شغل الوكلاء على درس: ${context.lesson.title}`,
      html: `
        <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #1a1a1a;">
          <h2 style="margin-top: 0;">ملخص شغل الوكلاء</h2>
          <p>أهلًا ${teacher.full_name}،</p>
          <p>
            فريق الوكلاء خلّص شغله على درس
            <strong>"${context.lesson.title}"</strong> في كورس
            <strong>"${context.course.title}"</strong>. ده اللي اتعمل:
          </p>
          <table style="width: 100%; border-collapse: collapse; background: #fafafa; border-radius: 8px; overflow: hidden;">
            <thead>
              <tr style="background: #f0f0f0; text-align: right;">
                <th style="padding: 10px 14px;">الوكيل</th>
                <th style="padding: 10px 14px;">النتيجة</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
          <p style="margin-top: 18px;">
            ${
              awaitingReview
                ? 'فيه شغل مستني مراجعتك — افتح صفحة الكورس، راجع «كاتب الشرح» و«واضع الأسئلة»، واعتمده عشان الطلاب يشوفوه.'
                : 'الدرس اتجهّز بالكامل وبقى جاهز للطلاب.'
            }
          </p>
          <p style="margin-top: 24px; color: #888; font-size: 13px;">فريق CourseFlix</p>
        </div>
      `,
    });
  }

  private renderStatus(step: StepSummaryRecord): string {
    const label = STATUS_LABELS[step.status];
    if (!label) return '—';
    return step.headline ? `${label}: ${step.headline}` : label;
  }

  // ── Persistence ──

  private async loadTeacher(teacherId: string): Promise<TeacherRecord | null> {
    const rows = (await this.dataSource.query(
      `SELECT full_name, email FROM users WHERE id = $1`,
      [teacherId],
    )) as unknown as TeacherRecord[];
    return rows[0] || null;
  }

  private async loadRunSteps(runId: string): Promise<StepSummaryRecord[]> {
    const rows = (await this.dataSource.query(
      `SELECT agent_key, status, headline
         FROM lesson_agent_steps
        WHERE run_id = $1 AND agent_key <> 'notifier'
        ORDER BY order_index ASC`,
      [runId],
    )) as unknown as StepSummaryRecord[];
    return rows;
  }
}
