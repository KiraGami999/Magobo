import { describe, expect, it } from 'vitest';
import { createReportSchema, adminResolveReportSchema, adminSuspendUserSchema } from '@magobo/shared';

describe('createReportSchema', () => {
  it('accepts a valid report', () => {
    const result = createReportSchema.safeParse({
      targetType: 'GIG',
      targetId: '550e8400-e29b-41d4-a716-446655440000',
      reason: 'FRAUD',
      description: 'This listing asks for payment outside the platform.',
    });
    expect(result.success).toBe(true);
  });

  it('rejects short descriptions', () => {
    const result = createReportSchema.safeParse({
      targetType: 'USER',
      targetId: '550e8400-e29b-41d4-a716-446655440000',
      reason: 'SPAM',
      description: 'bad',
    });
    expect(result.success).toBe(false);
  });
});

describe('adminResolveReportSchema', () => {
  it('accepts resolve or dismiss', () => {
    expect(adminResolveReportSchema.safeParse({ status: 'RESOLVED' }).success).toBe(true);
    expect(adminResolveReportSchema.safeParse({ status: 'DISMISSED' }).success).toBe(true);
  });
});

describe('adminSuspendUserSchema', () => {
  it('requires a reason', () => {
    expect(adminSuspendUserSchema.safeParse({ reason: 'Repeated off-platform contact' }).success).toBe(true);
    expect(adminSuspendUserSchema.safeParse({ reason: 'no' }).success).toBe(false);
  });
});
