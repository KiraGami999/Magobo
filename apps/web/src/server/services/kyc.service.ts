import 'server-only';
import { prisma, type KycDocumentType, type KycStatus, type User } from '@magobo/db';
import {
  BUSINESS_KYC_DOCUMENTS,
  INDIVIDUAL_KYC_DOCUMENTS,
  type AdminKycRejectInput,
} from '@magobo/shared';
import { ConflictError, NotFoundError, ValidationError } from '@/server/errors';
import { kycProvider } from '@/server/providers/kyc';
import { storageProvider } from '@/server/providers/storage';
import {
  requiredDocumentsForUser,
  toAdminKycCaseDetail,
  toAdminKycCaseSummary,
  toOwnKycStatus,
} from '@/server/serializers/kyc';

const SUBMITTABLE: KycStatus[] = ['NOT_STARTED', 'REJECTED'];
const REVIEWABLE: KycStatus[] = ['PENDING', 'UNDER_REVIEW'];

async function getOrCreateKycCase(userId: string) {
  const existing = await prisma.kycCase.findUnique({
    where: { userId },
    include: { documents: true },
  });
  if (existing) return existing;
  return prisma.kycCase.create({
    data: { userId },
    include: { documents: true },
  });
}

function assertTransition(current: KycStatus, allowed: KycStatus[], action: string): void {
  if (!allowed.includes(current)) {
    throw new ConflictError(`Cannot ${action} while KYC status is ${current}.`);
  }
}

export async function getOwnKyc(user: User) {
  const kycCase = await getOrCreateKycCase(user.id);
  return toOwnKycStatus(kycCase, user.roles);
}

export async function uploadKycDocument(
  user: User,
  documentType: KycDocumentType,
  file: { fileName: string; mimeType: string; data: Buffer },
) {
  const required = requiredDocumentsForUser(user.roles);
  if (!required.includes(documentType)) {
    throw new ValidationError('This document type is not required for your account.');
  }

  const kycCase = await getOrCreateKycCase(user.id);
  if (!['NOT_STARTED', 'REJECTED', 'PENDING'].includes(kycCase.status)) {
    throw new ConflictError('Documents cannot be changed while your KYC is under review or verified.');
  }

  const stored = await storageProvider.store({
    namespace: `kyc/${user.id}`,
    originalFileName: file.fileName,
    mimeType: file.mimeType,
    data: file.data,
  });

  const existing = kycCase.documents.find((doc) => doc.documentType === documentType);
  if (existing) {
    await storageProvider.delete(existing.storageKey).catch(() => undefined);
    await prisma.kycDocument.delete({ where: { id: existing.id } });
  }

  await prisma.kycDocument.create({
    data: {
      kycCaseId: kycCase.id,
      documentType,
      storageKey: stored.storageKey,
      originalFileName: stored.originalFileName,
      mimeType: stored.mimeType,
      fileSizeBytes: stored.fileSizeBytes,
    },
  });

  return getOwnKyc(user);
}

export async function submitKyc(user: User) {
  const kycCase = await getOrCreateKycCase(user.id);
  assertTransition(kycCase.status, SUBMITTABLE, 'submit KYC');

  const required = requiredDocumentsForUser(user.roles);
  const uploadedTypes = new Set(kycCase.documents.map((doc) => doc.documentType));
  const missing = required.filter((type) => !uploadedTypes.has(type as KycDocumentType));

  if (missing.length > 0) {
    throw new ValidationError(`Missing required documents: ${missing.join(', ')}`);
  }

  const updated = await prisma.kycCase.update({
    where: { id: kycCase.id },
    data: {
      status: 'PENDING',
      submittedAt: new Date(),
      rejectionReason: null,
      reviewedAt: null,
      reviewedByUserId: null,
    },
    include: { documents: true },
  });

  await kycProvider.notifySubmitted({
    kycCaseId: updated.id,
    userId: user.id,
    documentCount: updated.documents.length,
  });

  return toOwnKycStatus(updated, user.roles);
}

export async function listAdminKycQueue(status?: KycStatus) {
  const cases = await prisma.kycCase.findMany({
    where: status ? { status } : { status: { in: ['PENDING', 'UNDER_REVIEW'] } },
    include: { user: true, documents: true },
    orderBy: { submittedAt: 'asc' },
  });

  return Promise.all(cases.map(toAdminKycCaseSummary));
}

export async function getAdminKycCase(kycCaseId: string) {
  const kycCase = await prisma.kycCase.findUnique({
    where: { id: kycCaseId },
    include: { user: true, documents: true },
  });

  if (!kycCase) throw new NotFoundError('KYC case');

  if (kycCase.status === 'PENDING') {
    const underReview = await prisma.kycCase.update({
      where: { id: kycCaseId },
      data: { status: 'UNDER_REVIEW' },
      include: { user: true, documents: true },
    });
    return toAdminKycCaseDetail(underReview);
  }

  return toAdminKycCaseDetail(kycCase);
}

export async function approveKycCase(kycCaseId: string, adminUserId: string) {
  const kycCase = await prisma.kycCase.findUnique({ where: { id: kycCaseId } });
  if (!kycCase) throw new NotFoundError('KYC case');

  assertTransition(kycCase.status, REVIEWABLE, 'approve KYC');

  const updated = await prisma.kycCase.update({
    where: { id: kycCaseId },
    data: {
      status: 'VERIFIED',
      reviewedAt: new Date(),
      reviewedByUserId: adminUserId,
      rejectionReason: null,
      expiresAt: null,
    },
    include: { user: true, documents: true },
  });

  return toAdminKycCaseDetail(updated);
}

export async function rejectKycCase(
  kycCaseId: string,
  adminUserId: string,
  input: AdminKycRejectInput,
) {
  const kycCase = await prisma.kycCase.findUnique({ where: { id: kycCaseId } });
  if (!kycCase) throw new NotFoundError('KYC case');

  assertTransition(kycCase.status, REVIEWABLE, 'reject KYC');

  const updated = await prisma.kycCase.update({
    where: { id: kycCaseId },
    data: {
      status: 'REJECTED',
      reviewedAt: new Date(),
      reviewedByUserId: adminUserId,
      rejectionReason: input.reason,
    },
    include: { user: true, documents: true },
  });

  return toAdminKycCaseDetail(updated);
}

export async function getKycDocumentForAdminReview(storageKey: string) {
  const document = await prisma.kycDocument.findFirst({ where: { storageKey } });
  if (!document) throw new NotFoundError('Document');

  const url = await storageProvider.getSignedReadUrl(storageKey);
  return { document, url };
}

export { INDIVIDUAL_KYC_DOCUMENTS, BUSINESS_KYC_DOCUMENTS };
