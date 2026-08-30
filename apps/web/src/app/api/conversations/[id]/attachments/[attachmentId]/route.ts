import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { NextResponse, type NextRequest } from 'next/server';
import { withErrorHandling } from '@/server/api-response';
import { requireAuth } from '@/server/auth/guards';
import { NotFoundError } from '@/server/errors';
import { getMessageAttachmentFile } from '@/server/services/message.service';

export const GET = withErrorHandling(
  async (
    request: NextRequest,
    context: { params: Promise<{ id: string; attachmentId: string }> },
  ) => {
    const { user } = await requireAuth(request);
    const { id, attachmentId } = await context.params;
    const attachment = await getMessageAttachmentFile(user, id, attachmentId);

    const root = path.join(process.cwd(), '.storage');
    const filePath = path.join(root, attachment.storageKey);
    if (!filePath.startsWith(root)) throw new NotFoundError('Attachment');

    const data = await readFile(filePath);
    return new NextResponse(data, {
      headers: {
        'Content-Type': attachment.mimeType,
        'Content-Disposition': `inline; filename="${attachment.originalFileName}"`,
        'Cache-Control': 'private, max-age=3600',
      },
    });
  },
);
