import type { NextRequest } from 'next/server';
import { ALLOWED_PROFILE_PHOTO_MIME_TYPES, MAX_PROFILE_PHOTO_BYTES } from '@magobo/shared';
import { ok, withErrorHandling } from '@/server/api-response';
import { requireAuth } from '@/server/auth/guards';
import { ValidationError } from '@/server/errors';
import {
  assertAllowedMimeType,
  assertMaxFileSize,
  parseSingleFileUpload,
} from '@/server/upload';
import { uploadUserProfilePhoto } from '@/server/services/profile.service';

export const POST = withErrorHandling(async (request: NextRequest) => {
  const { user } = await requireAuth(request);
  const upload = await parseSingleFileUpload(request, 'photo');
  if (!upload) {
    throw new ValidationError('Photo file is required.');
  }

  assertAllowedMimeType(upload.mimeType, ALLOWED_PROFILE_PHOTO_MIME_TYPES);
  assertMaxFileSize(upload.data.byteLength, MAX_PROFILE_PHOTO_BYTES);

  const userProfile = await uploadUserProfilePhoto(user.id, {
    fileName: upload.fileName,
    mimeType: upload.mimeType,
    data: upload.data,
  });

  return ok({ userProfile }, 'Profile photo updated.');
});
