import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { NextResponse, type NextRequest } from 'next/server';
import { NotFoundError } from '@/server/errors';
import { withErrorHandling } from '@/server/api-response';
import { getProfilePhotoStorageKey } from '@/server/services/profile.service';

export const GET = withErrorHandling(
  async (request: NextRequest, context: { params: Promise<{ userId: string }> }) => {
    const { userId } = await context.params;
    const type = request.nextUrl.searchParams.get('type') === 'business' ? 'business' : 'user';
    const photo = await getProfilePhotoStorageKey(userId, type);
    if (!photo) throw new NotFoundError('Photo');

    const root = path.join(process.cwd(), '.storage');
    const filePath = path.join(root, photo.storageKey);
    if (!filePath.startsWith(root)) throw new NotFoundError('Photo');

    const data = await readFile(filePath);
    return new NextResponse(data, {
      headers: {
        'Content-Type': photo.mimeType,
        'Cache-Control': 'public, max-age=3600',
      },
    });
  },
);
