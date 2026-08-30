import { describe, expect, it } from 'vitest';
import { createGigSchema, GIG_TRANSITIONS } from '@magobo/shared';

describe('createGigSchema', () => {
  it('accepts a valid gig with budget max', () => {
    const result = createGigSchema.safeParse({
      title: 'Fix my kitchen sink',
      description: 'Need a licensed plumber to repair a leaking kitchen sink this week.',
      categoryId: '00000000-0000-4000-8000-000000000001',
      budgetMaxMinor: 150000,
    });
    expect(result.success).toBe(true);
  });

  it('rejects when no budget is provided', () => {
    const result = createGigSchema.safeParse({
      title: 'Fix my kitchen sink',
      description: 'Need a licensed plumber to repair a leaking kitchen sink this week.',
      categoryId: '00000000-0000-4000-8000-000000000001',
    });
    expect(result.success).toBe(false);
  });

  it('rejects when min budget exceeds max budget', () => {
    const result = createGigSchema.safeParse({
      title: 'Fix my kitchen sink',
      description: 'Need a licensed plumber to repair a leaking kitchen sink this week.',
      categoryId: '00000000-0000-4000-8000-000000000001',
      budgetMinMinor: 200000,
      budgetMaxMinor: 100000,
    });
    expect(result.success).toBe(false);
  });
});

describe('GIG_TRANSITIONS', () => {
  it('allows publishing from draft', () => {
    expect(GIG_TRANSITIONS.DRAFT).toContain('RECEIVING_PROPOSALS');
  });

  it('allows cancelling from receiving proposals', () => {
    expect(GIG_TRANSITIONS.RECEIVING_PROPOSALS).toContain('CANCELLED');
  });
});
