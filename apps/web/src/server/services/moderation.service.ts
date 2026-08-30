import 'server-only';

export type ModerationFlag =
  | 'PHONE_NUMBER'
  | 'EMAIL_ADDRESS'
  | 'EXTERNAL_PAYMENT'
  | 'EXTERNAL_CONTACT';

export interface ModerationResult {
  status: 'CLEAN' | 'FLAGGED';
  flags: ModerationFlag[];
}

const PHONE_PATTERN = /(?:\+?\d[\s\-().]{0,3})?(?:\d[\s\-().]{0,3}){7,}\d/;
const EMAIL_PATTERN = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;
const EXTERNAL_PAYMENT_PATTERN =
  /\b(pay\s*(me\s*)?(outside|off\s*platform|directly)|bank\s*transfer\s*to\s*my|cash\s*only|mobile\s*money\s*to\s*0)/i;
const EXTERNAL_CONTACT_PATTERN = /\b(whatsapp|telegram|signal|dm\s*me\s*on|message\s*me\s*on)\b/i;

/**
 * Lightweight server-side scan for obvious off-platform contact/payment
 * attempts. Messages are flagged for review but still delivered — Magobo
 * never blocks normal conversation aggressively.
 */
export function scanMessageContent(body: string): ModerationResult {
  const flags: ModerationFlag[] = [];

  if (PHONE_PATTERN.test(body)) flags.push('PHONE_NUMBER');
  if (EMAIL_PATTERN.test(body)) flags.push('EMAIL_ADDRESS');
  if (EXTERNAL_PAYMENT_PATTERN.test(body)) flags.push('EXTERNAL_PAYMENT');
  if (EXTERNAL_CONTACT_PATTERN.test(body)) flags.push('EXTERNAL_CONTACT');

  return {
    status: flags.length > 0 ? 'FLAGGED' : 'CLEAN',
    flags,
  };
}
