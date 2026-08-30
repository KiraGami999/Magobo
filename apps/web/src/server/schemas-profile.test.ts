import { describe, expect, it } from 'vitest';
import { updateUserProfileSchema, updateBusinessProfileSchema } from '@magobo/shared';

describe('updateUserProfileSchema', () => {
  it('accepts a valid profile update', () => {
    const result = updateUserProfileSchema.safeParse({
      bio: 'Experienced plumber.',
      location: { city: 'Lilongwe', country: 'Malawi' },
      skills: ['Plumbing', 'Repairs'],
      availability: 'AVAILABLE',
    });
    expect(result.success).toBe(true);
  });

  it('rejects too many skills', () => {
    const result = updateUserProfileSchema.safeParse({
      skills: Array.from({ length: 31 }, (_, i) => `skill-${i}`),
    });
    expect(result.success).toBe(false);
  });
});

describe('updateBusinessProfileSchema', () => {
  it('accepts a valid business profile update', () => {
    const result = updateBusinessProfileSchema.safeParse({
      businessName: 'Acme Services Ltd',
      websiteUrl: 'https://example.com',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid website URLs', () => {
    const result = updateBusinessProfileSchema.safeParse({ websiteUrl: 'not-a-url' });
    expect(result.success).toBe(false);
  });
});
