import { Injectable, Logger } from '@nestjs/common';

export interface EmailMessage {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export interface EmailProvider {
  sendEmail(message: EmailMessage): Promise<boolean>;
}

@Injectable()
export class ConsoleEmailProvider implements EmailProvider {
  private readonly logger = new Logger(ConsoleEmailProvider.name);

  async sendEmail(message: EmailMessage): Promise<boolean> {
    this.logger.log(`\n================== [OUTGOING EMAIL (DEV/CONSOLE)] ==================`);
    this.logger.log(`To: ${message.to}`);
    this.logger.log(`Subject: ${message.subject}`);
    this.logger.log(`Body:\n${message.text}`);
    this.logger.log(`===================================================================\n`);
    return true;
  }
}

@Injectable()
export class EmailService {
  private provider: EmailProvider;

  constructor(consoleProvider: ConsoleEmailProvider) {
    // Defaults to ConsoleEmailProvider for dev/test; ready for pluggable SES/Sendgrid/Resend in prod
    this.provider = consoleProvider;
  }

  /**
   * Set custom provider dynamically (e.g. for testing or production SMTP)
   */
  setProvider(provider: EmailProvider): void {
    this.provider = provider;
  }

  async sendPasswordResetOtp(email: string, otp: string, userName: string): Promise<boolean> {
    const subject = 'StockSense — Your Password Reset Code';
    const text = `Hello ${userName},\n\nYou recently requested to reset your password for your StockSense account.\nYour one-time verification code is: ${otp}\n\nThis code will expire in 10 minutes. If you did not request this password reset, please ignore this email or contact security.\n\nBest regards,\nThe StockSense Security Team`;

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #212529; border: 1px solid #e9ecef; border-radius: 8px;">
        <h2 style="color: #714B67; margin-bottom: 16px;">StockSense Verification</h2>
        <p>Hello <strong>${userName}</strong>,</p>
        <p>You requested a one-time verification code to reset your password. Use the code below to complete the reset process:</p>
        <div style="text-align: center; margin: 28px 0;">
          <span style="display: inline-block; font-size: 32px; font-weight: 700; letter-spacing: 6px; padding: 12px 24px; background: #f8f9fa; border: 2px dashed #714B67; color: #714B67; border-radius: 6px;">
            ${otp}
          </span>
        </div>
        <p style="color: #6c757d; font-size: 13px;">This code is valid for <strong>10 minutes</strong> and can only be used once. If you did not make this request, you can safely ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #dee2e6; margin: 24px 0;" />
        <p style="font-size: 12px; color: #adb5bd;">StockSense Enterprise Platform &bull; Security & Identity Subsystem</p>
      </div>
    `;

    return this.provider.sendEmail({
      to: email,
      subject,
      text,
      html,
    });
  }
}
