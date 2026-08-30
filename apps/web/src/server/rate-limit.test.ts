import { describe, expect, it } from 'vitest';
import { rateLimiter } from './rate-limit';

function uniqueKey(label: string): string {
  return `${label}-${Date.now()}-${Math.random()}`;
}

describe('InMemoryRateLimiter', () => {
  it('allows requests while under the limit', async () => {
    const key = uniqueKey('under-limit');
    const first = await rateLimiter.consume(key, 3, 60_000);
    const second = await rateLimiter.consume(key, 3, 60_000);
    expect(first.allowed).toBe(true);
    expect(second.allowed).toBe(true);
    expect(second.remaining).toBe(1);
  });

  it('blocks once the limit is exceeded within the window', async () => {
    const key = uniqueKey('over-limit');
    await rateLimiter.consume(key, 2, 60_000);
    await rateLimiter.consume(key, 2, 60_000);
    const third = await rateLimiter.consume(key, 2, 60_000);
    expect(third.allowed).toBe(false);
    expect(third.remaining).toBe(0);
  });

  it('resets once the window has elapsed', async () => {
    const key = uniqueKey('window-reset');
    await rateLimiter.consume(key, 1, 30);
    const blocked = await rateLimiter.consume(key, 1, 30);
    expect(blocked.allowed).toBe(false);

    await new Promise((resolve) => setTimeout(resolve, 45));

    const afterReset = await rateLimiter.consume(key, 1, 30);
    expect(afterReset.allowed).toBe(true);
  });
});
