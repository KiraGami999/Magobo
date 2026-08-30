import { describe, expect, it } from 'vitest';
import { sendMessageSchema, MESSAGING_ACTIVE_PROPOSAL_STATUSES } from '@magobo/shared';

describe('sendMessageSchema', () => {
  it('accepts a non-empty message', () => {
    const result = sendMessageSchema.safeParse({ body: 'Hello, when can you start?' });
    expect(result.success).toBe(true);
  });

  it('rejects empty messages', () => {
    const result = sendMessageSchema.safeParse({ body: '   ' });
    expect(result.success).toBe(false);
  });
});

describe('MESSAGING_ACTIVE_PROPOSAL_STATUSES', () => {
  it('includes accepted proposals', () => {
    expect(MESSAGING_ACTIVE_PROPOSAL_STATUSES).toContain('ACCEPTED');
  });

  it('excludes rejected proposals', () => {
    expect(MESSAGING_ACTIVE_PROPOSAL_STATUSES).not.toContain('REJECTED');
  });
});
