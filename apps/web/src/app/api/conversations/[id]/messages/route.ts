import type { NextRequest } from 'next/server';
import {
  ALLOWED_MESSAGE_ATTACHMENT_MIME_TYPES,
  MAX_MESSAGE_ATTACHMENT_BYTES,
  sendMessageSchema,
} from '@magobo/shared';
import { ok, withErrorHandling } from '@/server/api-response';
import { requireAuth } from '@/server/auth/guards';
import { ValidationError } from '@/server/errors';
import { parseOrThrow } from '@/server/validate';
import { assertAllowedMimeType, assertMaxFileSize } from '@/server/upload';
import { sendMessage } from '@/server/services/message.service';

export const POST = withErrorHandling(
  async (request: NextRequest, context: { params: Promise<{ id: string }> }) => {
    const { user } = await requireAuth(request);
    const { id } = await context.params;

    const contentType = request.headers.get('content-type') ?? '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const body = formData.get('body');
      if (typeof body !== 'string') {
        throw new ValidationError('Message body is required.');
      }

      const input = parseOrThrow(sendMessageSchema, { body });

      let file: { fileName: string; mimeType: string; data: Buffer } | undefined;
      const fileEntry = formData.get('file');
      if (fileEntry instanceof File) {
        const data = Buffer.from(await fileEntry.arrayBuffer());
        const mimeType = fileEntry.type || 'application/octet-stream';
        assertAllowedMimeType(mimeType, ALLOWED_MESSAGE_ATTACHMENT_MIME_TYPES);
        assertMaxFileSize(data.byteLength, MAX_MESSAGE_ATTACHMENT_BYTES);
        file = {
          fileName: fileEntry.name,
          mimeType,
          data,
        };
      }

      const message = await sendMessage(user, id, input, file);
      return ok({ message }, 'Message sent.');
    }

    const input = parseOrThrow(sendMessageSchema, await request.json());
    const message = await sendMessage(user, id, input);
    return ok({ message }, 'Message sent.');
  },
);
