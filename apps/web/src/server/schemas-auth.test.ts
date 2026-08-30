import { describe, expect, it } from 'vitest';
import { loginSchema, registerSchema, resetPasswordSchema } from '@magobo/shared';

describe('registerSchema', () => {
  it('accepts a valid registration with an email', () => {
    const result = registerSchema.safeParse({
      fullName: 'Jane Doe',
      email: 'jane@example.com',
      password: 'SecurePass123',
    });
    expect(result.success).toBe(true);
  });

  it('accepts a valid registration with a phone number instead of email', () => {
    const result = registerSchema.safeParse({
      fullName: 'Jane Doe',
      phone: '+15551234567',
      password: 'SecurePass123',
    });
    expect(result.success).toBe(true);
  });

  it('rejects registration with neither email nor phone', () => {
    const result = registerSchema.safeParse({ fullName: 'Jane Doe', password: 'SecurePass123' });
    expect(result.success).toBe(false);
  });

  it('rejects a weak password', () => {
    const result = registerSchema.safeParse({
      fullName: 'Jane Doe',
      email: 'jane@example.com',
      password: '123',
    });
    expect(result.success).toBe(false);
  });

  it('rejects a malformed email', () => {
    const result = registerSchema.safeParse({
      fullName: 'Jane Doe',
      email: 'not-an-email',
      password: 'SecurePass123',
    });
    expect(result.success).toBe(false);
  });
});

describe('loginSchema', () => {
  it('accepts email + password', () => {
    expect(loginSchema.safeParse({ email: 'jane@example.com', password: 'anything' }).success).toBe(
      true,
    );
  });

  it('rejects when neither email nor phone is provided', () => {
    expect(loginSchema.safeParse({ password: 'anything' }).success).toBe(false);
  });

  it('rejects an empty password', () => {
    expect(loginSchema.safeParse({ email: 'jane@example.com', password: '' }).success).toBe(false);
  });
});

describe('resetPasswordSchema', () => {
  it('rejects a too-short token', () => {
    expect(
      resetPasswordSchema.safeParse({ token: 'short', password: 'SecurePass123' }).success,
    ).toBe(false);
  });

  it('accepts a valid token and password', () => {
    expect(
      resetPasswordSchema.safeParse({
        token: 'a'.repeat(32),
        password: 'SecurePass123',
      }).success,
    ).toBe(true);
  });
});
