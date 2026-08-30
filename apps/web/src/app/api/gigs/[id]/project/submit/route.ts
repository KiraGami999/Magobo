import type { NextRequest } from 'next/server';
import {
  ALLOWED_DELIVERABLE_ATTACHMENT_MIME_TYPES,
  MAX_DELIVERABLE_ATTACHMENT_BYTES,
  submitDeliverableSchema,
} from '@magobo/shared';
import { ok, withErrorHandling } from '@/server/api-response';
import { requireAuth } from '@/server/auth/guards';
import { ValidationError } from '@/server/errors';
import { parseOrThrow } from '@/server/validate';
import { assertAllowedMimeType, assertMaxFileSize } from '@/server/upload';
import { submitDeliverable } from '@/server/services/project.service';

export const POST = withErrorHandling(
  async (request: NextRequest, context: { params: Promise<{ id: string }> }) => {
    const { user } = await requireAuth(request);
    const { id } = await context.params;

    const contentType = request.headers.get('content-type') ?? '';
    let input: { notes: string };
    const files: { fileName: string; mimeType: string; data: Buffer }[] = [];

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const notes = formData.get('notes');
      if (typeof notes !== 'string') throw new ValidationError('Submission notes are required.');
      input = parseOrThrow(submitDeliverableSchema, { notes });

      for (const entry of formData.getAll('files')) {
        if (!(entry instanceof File)) continue;
        const data = Buffer.from(await entry.arrayBuffer());
        const mimeType = entry.type || 'application/octet-stream';
        assertAllowedMimeType(mimeType, ALLOWED_DELIVERABLE_ATTACHMENT_MIME_TYPES);
        assertMaxFileSize(data.byteLength, MAX_DELIVERABLE_ATTACHMENT_BYTES);
        files.push({ fileName: entry.name, mimeType, data });
      }
    } else {
      input = parseOrThrow(submitDeliverableSchema, await request.json());
    }

    const project = await submitDeliverable(user, id, input, files);
    return ok({ project }, 'Deliverable submitted.');
  },
);
