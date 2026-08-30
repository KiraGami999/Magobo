import 'server-only';
import { prisma, type GigStatus, type User } from '@magobo/db';
import type { CreateGigInput, DiscoverGigsInput, PaginatedResult, UpdateGigInput } from '@magobo/shared';
import { ConflictError, NotFoundError, UnauthorizedError, ValidationError } from '@/server/errors';
import { requireOwnership } from '@/server/auth/guards';
import { storageProvider } from '@/server/providers/storage';
import { toPublicGig } from '@/server/serializers/gig';

const gigInclude = {
  category: true,
  attachments: true,
  owner: { include: { kycCase: { select: { status: true } } } },
  awardedProposal: { select: { providerUserId: true } },
} as const;

const DISCOVERABLE_STATUS: GigStatus = 'RECEIVING_PROPOSALS';

function assertGigTransition(current: GigStatus, next: GigStatus, action: string): void {
  const allowed: Partial<Record<GigStatus, GigStatus[]>> = {
    DRAFT: ['RECEIVING_PROPOSALS', 'CANCELLED'],
    RECEIVING_PROPOSALS: ['NEGOTIATING', 'AWARDED', 'CANCELLED'],
    NEGOTIATING: ['AWARDED', 'CANCELLED'],
  };

  const permitted = allowed[current];
  if (!permitted?.includes(next)) {
    throw new ConflictError(`Cannot ${action} a gig in ${current} status.`);
  }
}

async function getOwnedGigOrThrow(gigId: string, user: User) {
  const gig = await prisma.gig.findFirst({
    where: { id: gigId, deletedAt: null },
    include: gigInclude,
  });

  if (!gig) throw new NotFoundError('Gig');
  requireOwnership(user, gig.ownerUserId);
  return gig;
}

async function assertCategoryExists(categoryId: string): Promise<void> {
  const category = await prisma.serviceCategory.findUnique({ where: { id: categoryId } });
  if (!category) throw new ValidationError('Selected category is invalid.');
}

function buildLocationData(input: CreateGigInput | UpdateGigInput) {
  return {
    locationCity: input.location?.city,
    locationRegion: input.location?.region,
    locationCountry: input.location?.country,
    locationLat: input.location?.lat,
    locationLng: input.location?.lng,
  };
}

export async function createDraftGig(user: User, input: CreateGigInput) {
  if (user.status !== 'ACTIVE') {
    throw new UnauthorizedError('Verify your account before posting gigs.');
  }

  await assertCategoryExists(input.categoryId);

  const gig = await prisma.gig.create({
    data: {
      ownerUserId: user.id,
      title: input.title,
      description: input.description,
      categoryId: input.categoryId,
      budgetMinMinor: input.budgetMinMinor,
      budgetMaxMinor: input.budgetMaxMinor,
      currency: input.currency ?? 'MWK',
      deadlineAt: input.deadlineAt,
      ...buildLocationData(input),
      status: 'DRAFT',
    },
    include: gigInclude,
  });

  return toPublicGig(gig);
}

export async function updateDraftGig(user: User, gigId: string, input: UpdateGigInput) {
  const gig = await getOwnedGigOrThrow(gigId, user);

  if (gig.status !== 'DRAFT') {
    throw new ConflictError('Only draft gigs can be edited.');
  }

  if (input.categoryId) await assertCategoryExists(input.categoryId);

  const updated = await prisma.gig.update({
    where: { id: gigId },
    data: {
      title: input.title,
      description: input.description,
      categoryId: input.categoryId,
      budgetMinMinor: input.budgetMinMinor,
      budgetMaxMinor: input.budgetMaxMinor,
      currency: input.currency,
      deadlineAt: input.deadlineAt,
      ...buildLocationData(input),
    },
    include: gigInclude,
  });

  return toPublicGig(updated);
}

export async function getGig(gigId: string, viewer?: User) {
  const gig = await prisma.gig.findFirst({
    where: { id: gigId, deletedAt: null },
    include: gigInclude,
  });

  if (!gig) throw new NotFoundError('Gig');

  const isOwner = viewer?.id === gig.ownerUserId;
  const isAdmin = viewer?.roles.includes('ADMIN');
  const isAwardedProvider = viewer?.id === gig.awardedProposal?.providerUserId;
  const isPublic = gig.status === DISCOVERABLE_STATUS;

  if (!isOwner && !isAdmin && !isPublic && !isAwardedProvider) {
    throw new NotFoundError('Gig');
  }

  return toPublicGig(gig);
}

export async function discoverGigs(
  input: DiscoverGigsInput,
): Promise<PaginatedResult<ReturnType<typeof toPublicGig>>> {
  const page = input.page ?? 1;
  const pageSize = input.pageSize ?? 20;
  const skip = (page - 1) * pageSize;

  const where = {
    deletedAt: null,
    status: DISCOVERABLE_STATUS,
    ...(input.categoryId ? { categoryId: input.categoryId } : {}),
    ...(input.city ? { locationCity: { equals: input.city, mode: 'insensitive' as const } } : {}),
    ...(input.country ? { locationCountry: { equals: input.country, mode: 'insensitive' as const } } : {}),
    ...(input.budgetMinMinor !== undefined ? { budgetMaxMinor: { gte: input.budgetMinMinor } } : {}),
    ...(input.budgetMaxMinor !== undefined ? { budgetMinMinor: { lte: input.budgetMaxMinor } } : {}),
    ...(input.q
      ? {
          OR: [
            { title: { contains: input.q, mode: 'insensitive' as const } },
            { description: { contains: input.q, mode: 'insensitive' as const } },
          ],
        }
      : {}),
  };

  const [totalItems, gigs] = await Promise.all([
    prisma.gig.count({ where }),
    prisma.gig.findMany({
      where,
      include: gigInclude,
      orderBy: { publishedAt: 'desc' },
      skip,
      take: pageSize,
    }),
  ]);

  return {
    items: gigs.map((gig) => toPublicGig(gig)),
    page,
    pageSize,
    totalItems,
    totalPages: Math.ceil(totalItems / pageSize) || 1,
  };
}

export async function listMyGigs(user: User, input: DiscoverGigsInput) {
  const page = input.page ?? 1;
  const pageSize = input.pageSize ?? 20;
  const skip = (page - 1) * pageSize;

  const where = {
    ownerUserId: user.id,
    deletedAt: null,
    ...(input.q
      ? {
          OR: [
            { title: { contains: input.q, mode: 'insensitive' as const } },
            { description: { contains: input.q, mode: 'insensitive' as const } },
          ],
        }
      : {}),
  };

  const [totalItems, gigs] = await Promise.all([
    prisma.gig.count({ where }),
    prisma.gig.findMany({
      where,
      include: gigInclude,
      orderBy: { updatedAt: 'desc' },
      skip,
      take: pageSize,
    }),
  ]);

  return {
    items: gigs.map((gig) => toPublicGig(gig)),
    page,
    pageSize,
    totalItems,
    totalPages: Math.ceil(totalItems / pageSize) || 1,
  };
}

export async function publishGig(user: User, gigId: string) {
  const gig = await getOwnedGigOrThrow(gigId, user);
  assertGigTransition(gig.status, 'RECEIVING_PROPOSALS', 'publish');

  if (!gig.title.trim() || gig.description.trim().length < 20) {
    throw new ValidationError('Complete the title and description before publishing.');
  }

  if (gig.budgetMinMinor === null && gig.budgetMaxMinor === null) {
    throw new ValidationError('Set a budget before publishing.');
  }

  const updated = await prisma.gig.update({
    where: { id: gigId },
    data: {
      status: 'RECEIVING_PROPOSALS',
      publishedAt: new Date(),
    },
    include: gigInclude,
  });

  return toPublicGig(updated);
}

export async function cancelGig(user: User, gigId: string) {
  const gig = await getOwnedGigOrThrow(gigId, user);
  assertGigTransition(gig.status, 'CANCELLED', 'cancel');

  const updated = await prisma.gig.update({
    where: { id: gigId },
    data: { status: 'CANCELLED' },
    include: gigInclude,
  });

  return toPublicGig(updated);
}

export async function addGigAttachment(
  user: User,
  gigId: string,
  file: { fileName: string; mimeType: string; data: Buffer },
) {
  const gig = await getOwnedGigOrThrow(gigId, user);

  if (gig.status !== 'DRAFT') {
    throw new ConflictError('Attachments can only be added to draft gigs.');
  }

  const stored = await storageProvider.store({
    namespace: `gigs/${gigId}`,
    originalFileName: file.fileName,
    mimeType: file.mimeType,
    data: file.data,
  });

  await prisma.gigAttachment.create({
    data: {
      gigId,
      storageKey: stored.storageKey,
      originalFileName: stored.originalFileName,
      mimeType: stored.mimeType,
      fileSizeBytes: stored.fileSizeBytes,
    },
  });

  return getGig(gigId, user);
}

export async function removeGigAttachment(user: User, gigId: string, attachmentId: string) {
  const gig = await getOwnedGigOrThrow(gigId, user);

  if (gig.status !== 'DRAFT') {
    throw new ConflictError('Attachments can only be removed from draft gigs.');
  }

  const attachment = await prisma.gigAttachment.findFirst({
    where: { id: attachmentId, gigId },
  });

  if (!attachment) throw new NotFoundError('Attachment');

  await storageProvider.delete(attachment.storageKey).catch(() => undefined);
  await prisma.gigAttachment.delete({ where: { id: attachmentId } });

  return getGig(gigId, user);
}

export async function getGigAttachmentFile(gigId: string, attachmentId: string, viewer?: User) {
  await getGig(gigId, viewer);

  const record = await prisma.gigAttachment.findFirst({
    where: { id: attachmentId, gigId },
  });

  if (!record) throw new NotFoundError('Attachment');
  return record;
}
