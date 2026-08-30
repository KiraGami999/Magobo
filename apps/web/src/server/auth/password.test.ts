import { describe, expect, it } from 'vitest';
import { hashPassword, verifyPassword } from './password';

describe('password hashing', () => {
  it('produces a hash that verifies against the original password', async () => {
    const hash = await hashPassword('CorrectHorseBatteryStaple1');
    expect(hash).not.toBe('CorrectHorseBatteryStaple1');
    await expect(verifyPassword('CorrectHorseBatteryStaple1', hash)).resolves.toBe(true);
  });

  it('rejects an incorrect password', async () => {
    const hash = await hashPassword('CorrectHorseBatteryStaple1');
    await expect(verifyPassword('WrongPassword1', hash)).resolves.toBe(false);
  });

  it('produces a different hash each time due to random salting', async () => {
    const [a, b] = await Promise.all([
      hashPassword('same-password'),
      hashPassword('same-password'),
    ]);
    expect(a).not.toBe(b);
  });
});
