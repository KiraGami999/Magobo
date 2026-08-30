import type { Gig, GigReview, User } from '@magobo/db';
import type { PublicReview } from '@magobo/shared';

type ReviewWithRelations = GigReview & {
  gig: Pick<Gig, 'id' | 'title'>;
  reviewer: Pick<User, 'id' | 'fullName'>;
  reviewee: Pick<User, 'id' | 'fullName'>;
};

export function toPublicReview(review: ReviewWithRelations): PublicReview {
  return {
    id: review.id,
    gigId: review.gigId,
    gigTitle: review.gig.title,
    reviewerUserId: review.reviewerUserId,
    reviewerName: review.reviewer.fullName,
    revieweeUserId: review.revieweeUserId,
    revieweeName: review.reviewee.fullName,
    rating: review.rating,
    comment: review.comment,
    createdAt: review.createdAt.toISOString(),
  };
}
