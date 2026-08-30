import { describe, expect, it } from 'vitest';
import {
  createMilestoneSchema,
  PROJECT_GIG_TRANSITIONS,
  submitDeliverableSchema,
} from '@magobo/shared';

describe('createMilestoneSchema', () => {
  it('accepts a valid milestone', () => {
    const result = createMilestoneSchema.safeParse({ title: 'Design mockups' });
    expect(result.success).toBe(true);
  });

  it('rejects short titles', () => {
    const result = createMilestoneSchema.safeParse({ title: 'AB' });
    expect(result.success).toBe(false);
  });
});

describe('submitDeliverableSchema', () => {
  it('accepts detailed submission notes', () => {
    const result = submitDeliverableSchema.safeParse({
      notes: 'Attached are the final logo files in PNG and SVG formats.',
    });
    expect(result.success).toBe(true);
  });
});

describe('PROJECT_GIG_TRANSITIONS', () => {
  it('allows starting from awarded', () => {
    expect(PROJECT_GIG_TRANSITIONS.AWARDED).toContain('IN_PROGRESS');
  });

  it('allows completion from submitted', () => {
    expect(PROJECT_GIG_TRANSITIONS.SUBMITTED).toContain('COMPLETED');
  });
});
