import 'server-only';
import { ValidationError } from '@/server/errors';

export interface ParsedUpload {
  fieldName: string;
  fileName: string;
  mimeType: string;
  data: Buffer;
}

export async function parseSingleFileUpload(
  request: Request,
  fieldName: string,
): Promise<ParsedUpload | null> {
  const formData = await request.formData();
  const entry = formData.get(fieldName);

  if (!entry) return null;
  if (!(entry instanceof File)) {
    throw new ValidationError(`Expected a file upload for "${fieldName}".`);
  }

  const data = Buffer.from(await entry.arrayBuffer());
  return {
    fieldName,
    fileName: entry.name,
    mimeType: entry.type || 'application/octet-stream',
    data,
  };
}

export function assertAllowedMimeType(mimeType: string, allowed: readonly string[]): void {
  if (!allowed.includes(mimeType)) {
    throw new ValidationError('File type is not allowed.');
  }
}

export function assertMaxFileSize(sizeBytes: number, maxBytes: number): void {
  if (sizeBytes > maxBytes) {
    throw new ValidationError('File is too large.');
  }
}

export function parseDocumentTypeField(formData: FormData, fieldName = 'documentType'): string {
  const value = formData.get(fieldName);
  if (typeof value !== 'string' || !value.trim()) {
    throw new ValidationError('Document type is required.');
  }
  return value.trim();
}
