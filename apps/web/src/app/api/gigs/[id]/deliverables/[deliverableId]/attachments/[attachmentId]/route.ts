import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { NextResponse, type NextRequest } from 'next/server';
import { withErrorHandling } from '@/server/api-response';
import { requireAuth } from '@/server/auth/guards';
import { NotFoundError } from '@/server/errors';
import { getDeliverableAttachmentFile } from '@/server/services/project.service';

export const GET = withErrorHandling(
  async (
    request: NextRequest,
    context: { params: Promise<{ id: string; deliverableId: string; attachmentId: string }> },
  ) => {
    const { user } = await requireAuth(request);
    const { id, deliverableId, attachmentId } = await context.params;
    const attachment = await getDeliverableAttachmentFile(user, id, deliverableId, attachmentId);

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
