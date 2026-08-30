import { describe, expect, it } from 'vitest';
import { createReviewSchema } from '@magobo/shared';
import { PAYMENT_DISCLAIMER, PAYMENT_METHODS } from '@magobo/shared';

describe('createReviewSchema', () => {
  it('accepts a valid review', () => {
    const result = createReviewSchema.safeParse({ rating: 5, comment: 'Great work, very professional.' });
    expect(result.success).toBe(true);
  });

  it('rejects ratings outside 1–5', () => {
    const result = createReviewSchema.safeParse({ rating: 6 });
    expect(result.success).toBe(false);
  });
});

describe('payment seam constants', () => {
  it('lists PayChangu, cash, and bank transfer', () => {
    expect(PAYMENT_METHODS).toContain('PAYCHANGU');
    expect(PAYMENT_METHODS).toContain('CASH');
    expect(PAYMENT_METHODS).toContain('BANK_TRANSFER');
  });

  it('includes a no-escrow disclaimer', () => {
    expect(PAYMENT_DISCLAIMER).toMatch(/does not process payments/i);
  });
});
