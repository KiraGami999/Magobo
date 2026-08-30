import 'server-only';

export interface KycReviewRequest {
  kycCaseId: string;
  userId: string;
  documentCount: number;
}

export interface KycProvider {
  /** Notifies the (mock) verification pipeline that a case is ready for review. */
  notifySubmitted(request: KycReviewRequest): Promise<void>;
}

/**
 * Development/mock KYC provider — logs submission events only. No real
 * identity-verification vendor (Onfido, Smile ID, etc.) is integrated yet.
 * When one is, implement `KycProvider` and swap `kycProvider` below. Admin
 * review remains the source of truth until a real provider is wired up.
 */
class ConsoleKycProvider implements KycProvider {
  async notifySubmitted(request: KycReviewRequest): Promise<void> {
    console.log('[mock_kyc_provider] submission received for review', request);
  }
}

export const kycProvider: KycProvider = new ConsoleKycProvider();
