import type { NextRequest } from 'next/server';
import {
  ALLOWED_GIG_ATTACHMENT_MIME_TYPES,
  MAX_GIG_ATTACHMENT_BYTES,
} from '@magobo/shared';
import { ok, withErrorHandling } from '@/server/api-response';
import { requireAuth } from '@/server/auth/guards';
import { ValidationError } from '@/server/errors';
import {
  assertAllowedMimeType,
  assertMaxFileSize,
  parseSingleFileUpload,
} from '@/server/upload';
import { addGigAttachment } from '@/server/services/gig.service';

export const POST = withErrorHandling(
  async (request: NextRequest, context: { params: Promise<{ id: string }> }) => {
    const { user } = await requireAuth(request);
    const { id } = await context.params;

    const upload = await parseSingleFileUpload(request, 'file');
    if (!upload) throw new ValidationError('Attachment file is required.');

    assertAllowedMimeType(upload.mimeType, ALLOWED_GIG_ATTACHMENT_MIME_TYPES);
    assertMaxFileSize(upload.data.byteLength, MAX_GIG_ATTACHMENT_BYTES);

    const gig = await addGigAttachment(user, id, {
      fileName: upload.fileName,
      mimeType: upload.mimeType,
      data: upload.data,
    });

    return ok({ gig }, 'Attachment uploaded.');
  },
);
