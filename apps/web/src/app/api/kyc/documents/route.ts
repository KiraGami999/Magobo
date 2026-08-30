import type { NextRequest } from 'next/server';
import {
  ALLOWED_KYC_MIME_TYPES,
  MAX_KYC_FILE_BYTES,
  kycDocumentTypeSchema,
} from '@magobo/shared';
import { ok, withErrorHandling } from '@/server/api-response';
import { requireAuth } from '@/server/auth/guards';
import { ValidationError } from '@/server/errors';
import {
  assertAllowedMimeType,
  assertMaxFileSize,
  parseDocumentTypeField,
} from '@/server/upload';
import { uploadKycDocument } from '@/server/services/kyc.service';

export const POST = withErrorHandling(async (request: NextRequest) => {
  const { user } = await requireAuth(request);
  const formData = await request.formData();
  const fileEntry = formData.get('file');

  if (!(fileEntry instanceof File)) {
    throw new ValidationError('Document file is required.');
  }

  const documentTypeRaw = parseDocumentTypeField(formData);
  const documentType = kycDocumentTypeSchema.parse(documentTypeRaw);

  const data = Buffer.from(await fileEntry.arrayBuffer());
  assertAllowedMimeType(fileEntry.type || 'application/octet-stream', ALLOWED_KYC_MIME_TYPES);
  assertMaxFileSize(data.byteLength, MAX_KYC_FILE_BYTES);

  const kyc = await uploadKycDocument(user, documentType, {
    fileName: fileEntry.name,
    mimeType: fileEntry.type || 'application/octet-stream',
    data,
  });

  return ok({ kyc }, 'Document uploaded.');
});
