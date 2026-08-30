import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { NextResponse, type NextRequest } from 'next/server';
import { ok, withErrorHandling } from '@/server/api-response';
import { getSessionFromRequest } from '@/server/auth/session';
import { requireAuth } from '@/server/auth/guards';
import { NotFoundError } from '@/server/errors';
import { getGigAttachmentFile, removeGigAttachment } from '@/server/services/gig.service';

export const GET = withErrorHandling(
  async (request: NextRequest, context: { params: Promise<{ id: string; attachmentId: string }> }) => {
    const { id, attachmentId } = await context.params;
    const session = await getSessionFromRequest(request);
    const attachment = await getGigAttachmentFile(id, attachmentId, session?.user);

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

export const DELETE = withErrorHandling(
  async (request: NextRequest, context: { params: Promise<{ id: string; attachmentId: string }> }) => {
    const { user } = await requireAuth(request);
    const { id, attachmentId } = await context.params;
    const gig = await removeGigAttachment(user, id, attachmentId);
    return ok({ gig }, 'Attachment removed.');
  },
);
