import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { NextResponse, type NextRequest } from 'next/server';
import { NotFoundError } from '@/server/errors';
import { withErrorHandling } from '@/server/api-response';
import { requireAuth, requireRole } from '@/server/auth/guards';

/** Admin-only route to review KYC documents stored in the mock filesystem. */
export const GET = withErrorHandling(
  async (request: NextRequest, context: { params: Promise<{ key: string[] }> }) => {
    const { user } = await requireAuth(request);
    requireRole(user, 'ADMIN');

    const { key } = await context.params;
    const storageKey = key.map(decodeURIComponent).join('/');
    const root = path.join(process.cwd(), '.storage');
    const filePath = path.join(root, storageKey);

    if (!filePath.startsWith(root)) throw new NotFoundError('Document');

    const data = await readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const mimeType =
      ext === '.png'
        ? 'image/png'
        : ext === '.webp'
          ? 'image/webp'
          : ext === '.pdf'
            ? 'application/pdf'
            : 'image/jpeg';

    return new NextResponse(data, {
      headers: {
        'Content-Type': mimeType,
        'Cache-Control': 'private, no-store',
      },
    });
  },
);
