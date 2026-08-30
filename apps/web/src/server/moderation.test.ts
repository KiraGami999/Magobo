import { describe, expect, it } from 'vitest';
import { scanMessageContent } from '@/server/services/moderation.service';

describe('scanMessageContent', () => {
  it('returns clean for normal messages', () => {
    const result = scanMessageContent('I can start next Monday and bring my own tools.');
    expect(result.status).toBe('CLEAN');
    expect(result.flags).toHaveLength(0);
  });

  it('flags phone numbers without blocking delivery', () => {
    const result = scanMessageContent('Call me on +265 991 234 567');
    expect(result.status).toBe('FLAGGED');
    expect(result.flags).toContain('PHONE_NUMBER');
  });

  it('flags email addresses', () => {
    const result = scanMessageContent('Email me at provider@example.com');
    expect(result.status).toBe('FLAGGED');
    expect(result.flags).toContain('EMAIL_ADDRESS');
  });

  it('flags external contact apps', () => {
    const result = scanMessageContent('Message me on whatsapp instead');
    expect(result.status).toBe('FLAGGED');
    expect(result.flags).toContain('EXTERNAL_CONTACT');
  });
});
