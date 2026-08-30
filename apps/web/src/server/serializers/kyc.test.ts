import { describe, expect, it } from 'vitest';
import { requiredDocumentsForUser } from '@/server/serializers/kyc';

describe('requiredDocumentsForUser', () => {
  it('requires standard identity documents for individuals', () => {
    expect(requiredDocumentsForUser(['INDIVIDUAL'])).toEqual([
      'GOVERNMENT_ID_FRONT',
      'GOVERNMENT_ID_BACK',
      'SELFIE',
    ]);
  });

  it('adds business registration when the user has a BUSINESS role', () => {
    const docs = requiredDocumentsForUser(['INDIVIDUAL', 'BUSINESS']);
    expect(docs).toContain('BUSINESS_REGISTRATION');
    expect(docs).toHaveLength(4);
  });

  it('includes service provider docs without extra business docs when not a business', () => {
    expect(requiredDocumentsForUser(['SERVICE_PROVIDER'])).not.toContain('BUSINESS_REGISTRATION');
  });
});
