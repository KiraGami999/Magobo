import 'server-only';
import type { NextRequest } from 'next/server';
import { RateLimitedError } from '@/server/errors';

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
}

export interface RateLimiter {
  consume(key: string, limit: number, windowMs: number): Promise<RateLimitResult>;
}

/**
 * Fixed-window in-memory limiter. This is a **development-only**
 * implementation — it doesn't survive restarts and doesn't work across
 * multiple server instances. Swap `rateLimiter` below for a Redis-backed
 * (or similar) implementation of the same `RateLimiter` interface before
 * running more than one process in production. Business code never
 * depends on the concrete implementation, only on this interface.
 */
class InMemoryRateLimiter implements RateLimiter {
  private readonly buckets = new Map<string, { count: number; resetAt: number }>();

  async consume(key: string, limit: number, windowMs: number): Promise<RateLimitResult> {
    const now = Date.now();
    const existing = this.buckets.get(key);

    if (!existing || existing.resetAt <= now) {
      const resetAt = now + windowMs;
      this.buckets.set(key, { count: 1, resetAt });
      return { allowed: true, remaining: limit - 1, resetAt: new Date(resetAt) };
    }

    existing.count += 1;
    const allowed = existing.count <= limit;
    return {
      allowed,
      remaining: Math.max(0, limit - existing.count),
      resetAt: new Date(existing.resetAt),
    };
  }
}

export const rateLimiter: RateLimiter = new InMemoryRateLimiter();

export function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) return forwardedFor.split(',')[0]!.trim();
  return request.headers.get('x-real-ip') ?? 'unknown';
}

/**
 * Throws `RateLimitedError` once `limit` attempts for `action` from `key`
 * (typically an IP address) occur within `windowMs`. Used to slow down
 * brute-force login/registration/OTP attempts — never rely on client-side
 * throttling alone.
 */
export async function enforceRateLimit(
  key: string,
  action: string,
  limit: number,
  windowMs: number,
): Promise<void> {
  const result = await rateLimiter.consume(`${action}:${key}`, limit, windowMs);
  if (!result.allowed) {
    throw new RateLimitedError();
  }
}
