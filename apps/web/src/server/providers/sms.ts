import 'server-only';

export interface SmsMessage {
  to: string;
  body: string;
}

export interface SmsProvider {
  send(message: SmsMessage): Promise<void>;
}

/**
 * Development/mock implementation — logs instead of sending. No real SMS
 * provider (Twilio, Africa's Talking, etc.) is integrated yet. Implement
 * `SmsProvider` and swap `smsProvider` below when one is; never claim a
 * real SMS was sent when it wasn't.
 */
class ConsoleSmsProvider implements SmsProvider {
  async send(message: SmsMessage): Promise<void> {
    console.log('[mock_sms_provider]', { to: message.to, body: message.body });
  }
}

export const smsProvider: SmsProvider = new ConsoleSmsProvider();
