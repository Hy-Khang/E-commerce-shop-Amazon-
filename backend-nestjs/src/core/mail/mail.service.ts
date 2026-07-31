import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly mailerService: MailerService) {}

  async sendVerificationEmail(
    email: string,
    fullName: string,
    otp: string,
  ): Promise<void> {
    try {
      await this.mailerService.sendMail({
        to: email,
        subject: 'Verify your email address',
        template: 'verify-email',
        context: {
          fullName,
          otp,
          expiryMinutes: 5,
        },
      });
      this.logger.log(`Verification email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send verification email to ${email}`, error.stack);
      throw error;
    }
  }

  async sendPasswordResetEmail(
    email: string,
    fullName: string,
    resetUrl: string,
  ): Promise<void> {
    try {
      await this.mailerService.sendMail({
        to: email,
        subject: 'Reset your password',
        template: 'reset-password',
        context: {
          fullName,
          resetUrl,
          expiryHours: 1,
        },
      });
      this.logger.log(`Password reset email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send password reset email to ${email}`, error.stack);
    }
  }
}
