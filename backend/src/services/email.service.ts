import nodemailer, { type Transporter } from 'nodemailer';
import { env } from '../config/env';

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Email transport abstraction. When SMTP is not configured, messages are written to the
 * server console so flows (password reset, booking confirmation) remain testable locally.
 */
class EmailService {
  private transporter: Transporter | null = null;

  get mode(): 'smtp' | 'console' {
    return env.SMTP_HOST ? 'smtp' : 'console';
  }

  private getTransporter(): Transporter | null {
    if (!env.SMTP_HOST) return null;
    if (!this.transporter) {
      this.transporter = nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        secure: env.SMTP_PORT === 465,
        auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
      });
    }
    return this.transporter;
  }

  async send(message: EmailMessage): Promise<void> {
    const transporter = this.getTransporter();
    if (!transporter) {
      console.log(`\n📧 [email:console] To: ${message.to}\n   Subject: ${message.subject}\n   ${message.text ?? stripHtml(message.html)}\n`);
      return;
    }
    try {
      await transporter.sendMail({ from: env.EMAIL_FROM, ...message });
    } catch (err) {
      // Email failures must never break the booking flow.
      console.error('Email delivery failed:', (err as Error).message);
    }
  }
}

function stripHtml(html: string) {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 600);
}

function layout(title: string, body: string) {
  return `<div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:auto;color:#0f172a">
  <div style="padding:20px 24px;background:#0b3b3c;color:#fff;border-radius:12px 12px 0 0;font-size:20px;font-weight:700">Tripnaro</div>
  <div style="padding:24px;border:1px solid #e2e8f0;border-top:0;border-radius:0 0 12px 12px">
    <h2 style="margin:0 0 12px;font-size:18px">${title}</h2>${body}
  </div></div>`;
}

export const emailService = new EmailService();

export const emailTemplates = {
  welcome: (name: string) => ({
    subject: 'Welcome to Tripnaro',
    html: layout(`Welcome aboard, ${name}!`, '<p>Your Tripnaro account is ready. Start exploring flights, stays and tours.</p>'),
  }),
  passwordReset: (name: string, url: string) => ({
    subject: 'Reset your Tripnaro password',
    html: layout('Password reset', `<p>Hi ${name},</p><p>Use the link below to set a new password. It expires in 30 minutes.</p><p><a href="${url}">${url}</a></p><p>If you did not request this, you can ignore this email.</p>`),
    text: `Reset your password: ${url} (expires in 30 minutes)`,
  }),
  bookingConfirmed: (name: string, reference: string, title: string, total: string, url: string) => ({
    subject: `Booking confirmed · ${reference}`,
    html: layout('Your booking is confirmed', `<p>Hi ${name},</p><p><strong>${title}</strong></p><p>Reference: <strong>${reference}</strong><br/>Total paid: ${total}</p><p><a href="${url}">View booking</a></p>`),
    text: `Booking ${reference} confirmed: ${title}. Total ${total}. ${url}`,
  }),
  bookingCancelled: (name: string, reference: string) => ({
    subject: `Booking cancelled · ${reference}`,
    html: layout('Booking cancelled', `<p>Hi ${name}, your booking <strong>${reference}</strong> has been cancelled.</p>`),
  }),
  visaStatus: (name: string, reference: string, status: string) => ({
    subject: `Visa application ${reference}: ${status.replace(/_/g, ' ')}`,
    html: layout('Visa application update', `<p>Hi ${name}, your application <strong>${reference}</strong> is now <strong>${status.replace(/_/g, ' ')}</strong>.</p>`),
  }),
};
