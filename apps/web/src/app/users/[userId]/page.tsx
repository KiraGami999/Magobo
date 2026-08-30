'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import type { PaginatedResult, PublicProfileView, PublicReview } from '@magobo/shared';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { VerificationBadge } from '@/components/magobo/verification-badge';
import { LoadingState } from '@/components/magobo/loading-state';
import { ErrorState } from '@/components/magobo/error-state';
import { apiGet } from '@/lib/api-client';

export default function PublicUserProfilePage() {
  const params = useParams<{ userId: string }>();
  const [profile, setProfile] = useState<PublicProfileView | null>(null);
  const [reviews, setReviews] = useState<PublicReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!params.userId) return;
    setLoading(true);
    const [profileRes, reviewsRes] = await Promise.all([
      apiGet<{ profile: PublicProfileView }>(`/api/profile/${params.userId}`),
      apiGet<PaginatedResult<PublicReview>>(`/api/users/${params.userId}/reviews`),
    ]);

    if (!profileRes.success) {
      setError(profileRes.error.message);
      setLoading(false);
      return;
    }

    setProfile(profileRes.data.profile);
    if (reviewsRes.success) setReviews(reviewsRes.data.items);
    setLoading(false);
  }, [params.userId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  if (loading) return <LoadingState page />;
  if (error) return <ErrorState page description={error} onRetry={load} />;
  if (!profile) return null;

  const trust = profile.userProfile ?? profile.businessProfile;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">{profile.fullName}</h1>
            {profile.kycVerified && <VerificationBadge state="verified" showLabel />}
          </div>
          {profile.businessProfile && (
            <p className="text-muted-foreground text-sm">{profile.businessProfile.businessName}</p>
          )}
        </div>
        <Link href="/gigs" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
          Back
        </Link>
      </div>

      {trust && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Trust</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-3">
            <div>
              <p className="text-muted-foreground text-xs">Rating</p>
              <p className="font-medium">{trust.averageRating.toFixed(1)} / 5</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Reviews</p>
              <p className="font-medium">{trust.reviewCount}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Completed gigs</p>
              <p className="font-medium">{trust.completedGigsCount}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {profile.userProfile?.bio && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">About</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed">{profile.userProfile.bio}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Reviews</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {reviews.length === 0 ? (
            <p className="text-muted-foreground text-sm">No reviews yet.</p>
          ) : (
            reviews.map((review) => (
              <div key={review.id} className="rounded-lg border p-3">
                <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-medium">{review.reviewerName}</span>
                  <span className="text-sm">{review.rating}/5</span>
                </div>
                <p className="text-muted-foreground mb-1 text-xs">{review.gigTitle}</p>
                {review.comment && <p className="text-sm">{review.comment}</p>}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
