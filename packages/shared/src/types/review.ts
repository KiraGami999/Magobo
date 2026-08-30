export interface PublicReview {
  id: string;
  gigId: string;
  gigTitle: string;
  reviewerUserId: string;
  reviewerName: string;
  revieweeUserId: string;
  revieweeName: string;
  rating: number;
  comment: string | null;
  createdAt: string;
}

export interface ReviewSummary {
  averageRating: number;
  reviewCount: number;
}

export interface GigReviewStatus {
  gigId: string;
  gigTitle: string;
  canReview: boolean;
  hasReviewed: boolean;
  revieweeUserId: string | null;
  revieweeName: string | null;
}
