/** KYC status exposed to the account owner — no document contents or storage keys. */
export interface OwnKycStatus {
  status: string;
  submittedAt: string | null;
  reviewedAt: string | null;
  rejectionReason: string | null;
  expiresAt: string | null;
  requiredDocuments: string[];
  uploadedDocuments: KycDocumentSummary[];
}

export interface KycDocumentSummary {
  id: string;
  documentType: string;
  originalFileName: string;
  uploadedAt: string;
}

/** Admin-only KYC queue item — includes reviewer metadata, not raw document bytes. */
export interface AdminKycCaseSummary {
  id: string;
  userId: string;
  userFullName: string;
  userEmail: string | null;
  status: string;
  submittedAt: string | null;
  documentCount: number;
}

export interface AdminKycCaseDetail extends AdminKycCaseSummary {
  reviewedAt: string | null;
  rejectionReason: string | null;
  documents: AdminKycDocument[];
}

/** Admin document view includes a short-lived signed URL for review — never the storage key. */
export interface AdminKycDocument {
  id: string;
  documentType: string;
  originalFileName: string;
  mimeType: string;
  fileSizeBytes: number;
  uploadedAt: string;
  reviewUrl: string;
}
