'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { PaginatedResult, PublicGig } from '@magobo/shared';
import { buttonVariants } from '@/components/ui/button';
import { GigCard } from '@/components/magobo/gig-card';
import { LoadingState } from '@/components/magobo/loading-state';
import { ErrorState } from '@/components/magobo/error-state';
import { EmptyState } from '@/components/magobo/empty-state';
import { apiGet } from '@/lib/api-client';
import { useCurrentUser } from '@/lib/use-current-user';

export default function MyGigsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useCurrentUser();
  const [gigs, setGigs] = useState<PaginatedResult<PublicGig> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const response = await apiGet<PaginatedResult<PublicGig>>('/api/gigs/mine');
    if (!response.success) {
      setError(response.error.message);
      setLoading(false);
      return;
    }
    setGigs(response.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
      return;
    }
    if (user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      void load();
    }
  }, [authLoading, user, router, load]);

  if (authLoading || loading) return <LoadingState />;
  if (error) return <ErrorState description={error} onRetry={load} />;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">My gigs</h1>
          <p className="text-muted-foreground text-sm">Manage gigs you have posted.</p>
        </div>
        <Link href="/gigs/new" className={buttonVariants({ size: 'sm' })}>
          Post a gig
        </Link>
      </div>

      {gigs?.items.length === 0 ? (
        <EmptyState title="No gigs yet" description="Post your first gig to start receiving proposals." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {gigs?.items.map((gig) => <GigCard key={gig.id} gig={gig} />)}
        </div>
      )}
    </div>
  );
}
