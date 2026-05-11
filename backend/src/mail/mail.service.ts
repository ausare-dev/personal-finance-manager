import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import * as dns from 'dns';

@Injectable()
export class MailService implements OnModuleInit {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    const smtpHost = this.configService.get<string>(
      'SMTP_HOST',
      'smtp.yandex.ru',
    );
    const smtpPort = this.configService.get<number>('SMTP_PORT', 465);
    const smtpSecure =
      this.configService.get<string>('SMTP_SECURE', 'true') === 'true';

    let resolvedHost = smtpHost;
    try {
      const { address } = await dns.promises.lookup(smtpHost, { family: 4 });
      resolvedHost = address;
    } catch {
      this.logger.warn(`Could not resolve ${smtpHost} to IPv4, using hostname`);
    }

    this.transporter = nodemailer.createTransport({
      host: resolvedHost,
      port: smtpPort,
      secure: smtpSecure,
      auth: {
        user: this.configService.get<string>('SMTP_USER', ''),
        pass: this.configService.get<string>('SMTP_PASS', ''),
      },
      tls: { servername: smtpHost },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 10000,
    } as nodemailer.TransportOptions);
  }

  async sendPasswordResetEmail(to: string, resetToken: string): Promise<void> {
    const frontendUrl = this.configService.get<string>(
      'FRONTEND_URL',
      'http://localhost:3001',
    );
    const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;
    const smtpUser = this.configService.get<string>('SMTP_USER', '');

    const mailOptions: nodemailer.SendMailOptions = {
      from: smtpUser,
      to,
      subject: 'Password reset',
      text: `You requested a password reset.\n\nFollow this link to set a new password:\n${resetLink}\n\nThe link is valid for 1 hour.\nIf you did not request this, ignore this email.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #1890ff;">Password reset</h2>
          <p>You requested a password reset for your account.</p>
          <p>Click the button below to set a new password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}"
               style="background: #1890ff; color: #fff; padding: 12px 32px;
                      text-decoration: none; border-radius: 6px; font-size: 16px;">
              Reset password
            </a>
          </div>
          <p style="color: #666; font-size: 14px;">
            If you did not request a password reset, just ignore this email.
          </p>
          <p style="color: #999; font-size: 12px;">
            This link is valid for 1 hour.
          </p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="color: #999; font-size: 12px;">
            If the button does not work, copy this link into your browser:<br/>
            <a href="${resetLink}" style="color: #1890ff;">${resetLink}</a>
          </p>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Password reset email sent to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send password reset email to ${to}`, error);
      throw error;
    }
  }
}
