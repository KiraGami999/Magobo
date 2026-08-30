import type { KycCase, KycDocument, User } from '@magobo/db';
import type {
  AdminKycCaseDetail,
  AdminKycCaseSummary,
  AdminKycDocument,
  KycDocumentSummary,
  OwnKycStatus,
} from '@magobo/shared';
import { BUSINESS_KYC_DOCUMENTS, INDIVIDUAL_KYC_DOCUMENTS } from '@magobo/shared';
import { storageProvider } from '@/server/providers/storage';

export function requiredDocumentsForUser(roles: string[]): string[] {
  const docs: string[] = [...INDIVIDUAL_KYC_DOCUMENTS];
  if (roles.includes('BUSINESS')) {
    docs.push(...BUSINESS_KYC_DOCUMENTS);
  }
  return docs;
}

export function toOwnKycStatus(
  kycCase: KycCase & { documents: KycDocument[] },
  roles: string[],
): OwnKycStatus {
  return {
    status: kycCase.status,
    submittedAt: kycCase.submittedAt?.toISOString() ?? null,
    reviewedAt: kycCase.reviewedAt?.toISOString() ?? null,
    rejectionReason: kycCase.rejectionReason,
    expiresAt: kycCase.expiresAt?.toISOString() ?? null,
    requiredDocuments: requiredDocumentsForUser(roles),
    uploadedDocuments: kycCase.documents.map(toKycDocumentSummary),
  };
}

export function toKycDocumentSummary(document: KycDocument): KycDocumentSummary {
  return {
    id: document.id,
    documentType: document.documentType,
    originalFileName: document.originalFileName,
    uploadedAt: document.uploadedAt.toISOString(),
  };
}

export async function toAdminKycCaseSummary(
  kycCase: KycCase & { user: User; documents: KycDocument[] },
): Promise<AdminKycCaseSummary> {
  return {
    id: kycCase.id,
    userId: kycCase.userId,
    userFullName: kycCase.user.fullName,
    userEmail: kycCase.user.email,
    status: kycCase.status,
    submittedAt: kycCase.submittedAt?.toISOString() ?? null,
    documentCount: kycCase.documents.length,
  };
}

export async function toAdminKycCaseDetail(
  kycCase: KycCase & { user: User; documents: KycDocument[] },
): Promise<AdminKycCaseDetail> {
  const summary = await toAdminKycCaseSummary(kycCase);
  const documents: AdminKycDocument[] = await Promise.all(
    kycCase.documents.map(async (document) => ({
      id: document.id,
      documentType: document.documentType,
      originalFileName: document.originalFileName,
      mimeType: document.mimeType,
      fileSizeBytes: document.fileSizeBytes,
      uploadedAt: document.uploadedAt.toISOString(),
      reviewUrl: await storageProvider.getSignedReadUrl(document.storageKey),
    })),
  );

  return {
    ...summary,
    reviewedAt: kycCase.reviewedAt?.toISOString() ?? null,
    rejectionReason: kycCase.rejectionReason,
    documents,
  };
}
