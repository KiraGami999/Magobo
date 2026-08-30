import { describe, expect, it } from 'vitest';
import { generateNumericOtp, generateOpaqueToken, hashToken } from './tokens';

describe('generateOpaqueToken', () => {
  it('generates unique, high-entropy tokens', () => {
    const a = generateOpaqueToken();
    const b = generateOpaqueToken();
    expect(a).not.toBe(b);
    expect(a.length).toBeGreaterThan(30);
  });
});

describe('generateNumericOtp', () => {
  it('always returns a zero-padded 6-digit code', () => {
    for (let i = 0; i < 100; i++) {
      expect(generateNumericOtp()).toMatch(/^\d{6}$/);
    }
  });
});

describe('hashToken', () => {
  it('is deterministic for the same input', () => {
    const token = generateOpaqueToken();
    expect(hashToken(token)).toBe(hashToken(token));
  });

  it('produces different hashes for different inputs', () => {
    expect(hashToken('a')).not.toBe(hashToken('b'));
  });

  it('never returns the raw input (one-way)', () => {
    expect(hashToken('my-raw-token')).not.toBe('my-raw-token');
  });
});
