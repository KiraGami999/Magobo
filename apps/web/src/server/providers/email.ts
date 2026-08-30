import 'server-only';

export interface EmailMessage {
  to: string;
  subject: string;
  body: string;
}

export interface EmailProvider {
  send(message: EmailMessage): Promise<void>;
}

/**
 * Development/mock implementation — logs instead of sending. No real
 * email provider is integrated yet. When one is (SES, Postmark, Resend,
 * ...), implement `EmailProvider` and swap `emailProvider` below; nothing
 * else in the codebase should need to change, since callers only depend
 * on this interface.
 */
class ConsoleEmailProvider implements EmailProvider {
  async send(message: EmailMessage): Promise<void> {
    console.log('[mock_email_provider]', {
      to: message.to,
      subject: message.subject,
      body: message.body,
    });
  }
}

export const emailProvider: EmailProvider = new ConsoleEmailProvider();
