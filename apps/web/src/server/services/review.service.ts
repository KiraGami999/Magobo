import 'server-only';
import { prisma, type User } from '@magobo/db';
import type { CreateReviewInput, ListReviewsInput, PaginatedResult } from '@magobo/shared';
import { ConflictError, NotFoundError, UnauthorizedError } from '@/server/errors';
import { notificationProvider } from '@/server/providers/notification';
import { toPublicReview } from '@/server/serializers/review';

const reviewInclude = {
  gig: { select: { id: true, title: true } },
  reviewer: { select: { id: true, fullName: true } },
  reviewee: { select: { id: true, fullName: true } },
} as const;

const REVIEWABLE_GIG_STATUSES = ['COMPLETED', 'REVIEWED'] as const;

async function recalculateTrustStats(userId: string): Promise<void> {
  const aggregate = await prisma.gigReview.aggregate({
    where: { revieweeUserId: userId },
    _avg: { rating: true },
    _count: { rating: true },
  });

  const averageRating = aggregate._avg.rating ?? 0;
  const reviewCount = aggregate._count.rating;

  const completedGigsAsOwner = await prisma.gig.count({
    where: { ownerUserId: userId, status: { in: ['COMPLETED', 'REVIEWED'] }, deletedAt: null },
  });

  const completedGigsAsProvider = await prisma.gig.count({
    where: {
      awardedProposal: { providerUserId: userId },
      status: { in: ['COMPLETED', 'REVIEWED'] },
      deletedAt: null,
    },
  });

  const completedGigsCount = completedGigsAsOwner + completedGigsAsProvider;

  const stats = {
    averageRating: Math.round(averageRating * 10) / 10,
    reviewCount,
    completedGigsCount,
  };

  await prisma.userProfile.updateMany({ where: { userId }, data: stats });
  await prisma.businessProfile.updateMany({ where: { userId }, data: stats });
}

async function maybeMarkGigReviewed(gigId: string): Promise<void> {
  const gig = await prisma.gig.findUnique({
    where: { id: gigId },
    include: {
      awardedProposal: { select: { providerUserId: true } },
      reviews: { select: { reviewerUserId: true } },
    },
  });

  if (!gig || gig.status !== 'COMPLETED') return;

  const providerId = gig.awardedProposal?.providerUserId;
  if (!providerId) return;

  const reviewerIds = new Set(gig.reviews.map((review) => review.reviewerUserId));
  if (reviewerIds.has(gig.ownerUserId) && reviewerIds.has(providerId)) {
    await prisma.gig.update({ where: { id: gigId }, data: { status: 'REVIEWED' } });
  }
}

export async function incrementCompletedGigsForParticipants(
  ownerUserId: string,
  providerUserId: string,
): Promise<void> {
  await recalculateTrustStats(ownerUserId);
  await recalculateTrustStats(providerUserId);
}

export async function createReview(user: User, gigId: string, input: CreateReviewInput) {
  const gig = await prisma.gig.findFirst({
    where: { id: gigId, deletedAt: null },
    include: { awardedProposal: { include: { provider: true } } },
  });

  if (!gig) throw new NotFoundError('Gig');

  if (!REVIEWABLE_GIG_STATUSES.includes(gig.status as (typeof REVIEWABLE_GIG_STATUSES)[number])) {
    throw new ConflictError('Reviews can only be left after the project is completed.');
  }

  const providerId = gig.awardedProposal?.providerUserId;
  if (!providerId) throw new ConflictError('This gig has no awarded provider.');

  const isOwner = user.id === gig.ownerUserId;
  const isProvider = user.id === providerId;

  if (!isOwner && !isProvider) {
    throw new UnauthorizedError();
  }

  const revieweeUserId = isOwner ? providerId : gig.ownerUserId;

  const existing = await prisma.gigReview.findUnique({
    where: { gigId_reviewerUserId: { gigId, reviewerUserId: user.id } },
  });

  if (existing) {
    throw new ConflictError('You have already reviewed this gig.');
  }

  const review = await prisma.gigReview.create({
    data: {
      gigId,
      reviewerUserId: user.id,
      revieweeUserId,
      rating: input.rating,
      comment: input.comment,
    },
    include: reviewInclude,
  });

  await recalculateTrustStats(revieweeUserId);
  await maybeMarkGigReviewed(gigId);

  await notificationProvider.notify({
    event: 'REVIEW_RECEIVED',
    recipientUserId: revieweeUserId,
    title: 'New review received',
    body: `${user.fullName} left you a ${input.rating}-star review on "${gig.title}".`,
    metadata: { gigId, reviewId: review.id },
  });

  return toPublicReview(review);
}

export async function listReviewsForUser(userId: string, input: ListReviewsInput) {
  const page = input.page ?? 1;
  const pageSize = input.pageSize ?? 20;
  const skip = (page - 1) * pageSize;

  const where = { revieweeUserId: userId };

  const [totalItems, reviews] = await Promise.all([
    prisma.gigReview.count({ where }),
    prisma.gigReview.findMany({
      where,
      include: reviewInclude,
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
    }),
  ]);

  return {
    items: reviews.map(toPublicReview),
    page,
    pageSize,
    totalItems,
    totalPages: Math.ceil(totalItems / pageSize) || 1,
  } satisfies PaginatedResult<ReturnType<typeof toPublicReview>>;
}

export async function listReviewsForGig(user: User, gigId: string) {
  const gig = await prisma.gig.findFirst({
    where: { id: gigId, deletedAt: null },
    include: { awardedProposal: { select: { providerUserId: true } } },
  });

  if (!gig) throw new NotFoundError('Gig');

  const providerId = gig.awardedProposal?.providerUserId;
  const isParticipant =
    user.id === gig.ownerUserId || user.id === providerId || user.roles.includes('ADMIN');

  if (!isParticipant) throw new UnauthorizedError();

  const reviews = await prisma.gigReview.findMany({
    where: { gigId },
    include: reviewInclude,
    orderBy: { createdAt: 'desc' },
  });

  return reviews.map(toPublicReview);
}

export async function getPendingReviewForGig(user: User, gigId: string) {
  const gig = await prisma.gig.findFirst({
    where: { id: gigId, deletedAt: null },
    include: {
      awardedProposal: { include: { provider: { select: { id: true, fullName: true } } } },
      owner: { select: { id: true, fullName: true } },
    },
  });

  if (!gig) throw new NotFoundError('Gig');

  const provider = gig.awardedProposal?.provider;
  if (!provider) return { canReview: false, hasReviewed: false, reviewee: null };

  const isOwner = user.id === gig.ownerUserId;
  const isProvider = user.id === provider.id;

  if (!isOwner && !isProvider) {
    throw new UnauthorizedError();
  }

  const canReview = REVIEWABLE_GIG_STATUSES.includes(
    gig.status as (typeof REVIEWABLE_GIG_STATUSES)[number],
  );

  const existing = await prisma.gigReview.findUnique({
    where: { gigId_reviewerUserId: { gigId, reviewerUserId: user.id } },
  });

  const reviewee = isOwner
    ? { userId: provider.id, fullName: provider.fullName }
    : { userId: gig.owner.id, fullName: gig.owner.fullName };

  return {
    canReview: canReview && !existing,
    hasReviewed: Boolean(existing),
    reviewee,
  };
}
