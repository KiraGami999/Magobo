import { describe, expect, it } from 'vitest';
import {
  counterOfferSchema,
  PROPOSAL_TRANSITIONS,
  submitProposalSchema,
} from '@magobo/shared';

describe('submitProposalSchema', () => {
  it('accepts a valid proposal', () => {
    const result = submitProposalSchema.safeParse({
      coverLetter: 'I have five years of plumbing experience and can start immediately.',
      amountMinor: 150000,
    });
    expect(result.success).toBe(true);
  });

  it('rejects a short cover letter', () => {
    const result = submitProposalSchema.safeParse({
      coverLetter: 'Too short',
      amountMinor: 150000,
    });
    expect(result.success).toBe(false);
  });

  it('rejects non-positive amounts', () => {
    const result = submitProposalSchema.safeParse({
      coverLetter: 'I have five years of plumbing experience and can start immediately.',
      amountMinor: 0,
    });
    expect(result.success).toBe(false);
  });
});

describe('counterOfferSchema', () => {
  it('accepts message-only counter-offers', () => {
    const result = counterOfferSchema.safeParse({
      message: 'Can we meet in the middle on timeline?',
    });
    expect(result.success).toBe(true);
  });

  it('accepts counter-offers with amount', () => {
    const result = counterOfferSchema.safeParse({
      message: 'I can do it for this price instead.',
      amountMinor: 120000,
    });
    expect(result.success).toBe(true);
  });
});

describe('PROPOSAL_TRANSITIONS', () => {
  it('allows accept from submitted', () => {
    expect(PROPOSAL_TRANSITIONS.SUBMITTED).toContain('ACCEPTED');
  });

  it('does not allow transitions from accepted', () => {
    expect(PROPOSAL_TRANSITIONS.ACCEPTED).toBeUndefined();
  });
});
