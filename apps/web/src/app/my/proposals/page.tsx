'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { PublicProposal } from '@magobo/shared';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/magobo/status-badge';
import { LoadingState } from '@/components/magobo/loading-state';
import { ErrorState } from '@/components/magobo/error-state';
import { EmptyState } from '@/components/magobo/empty-state';
import { formatMinorCurrency } from '@/lib/format-money';
import { apiGet } from '@/lib/api-client';
import { useCurrentUser } from '@/lib/use-current-user';

export default function MyProposalsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useCurrentUser();
  const [proposals, setProposals] = useState<PublicProposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const response = await apiGet<{ items: PublicProposal[] }>('/api/proposals/mine');
    if (!response.success) {
      setError(response.error.message);
      setLoading(false);
      return;
    }
    setProposals(response.data.items);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login');
  }, [authLoading, user, router]);

  useEffect(() => {
    if (user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      void load();
    }
  }, [user, load]);

  if (authLoading || loading) return <LoadingState page />;
  if (error) return <ErrorState page description={error} onRetry={load} />;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">My proposals</h1>
        <Link href="/gigs" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
          Browse gigs
        </Link>
      </div>

      {proposals.length === 0 ? (
        <EmptyState
          title="No proposals yet"
          description="Browse open gigs and submit your first proposal."
          action={
            <Link href="/gigs" className={buttonVariants({ size: 'sm' })}>
              Find gigs
            </Link>
          }
        />
      ) : (
        <div className="space-y-4">
          {proposals.map((proposal) => (
            <Card key={proposal.id}>
              <CardHeader className="pb-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <CardTitle className="text-base">{proposal.gig?.title ?? 'Gig'}</CardTitle>
                  <StatusBadge tone="info" label={proposal.status.replaceAll('_', ' ')} />
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm font-medium">
                  {formatMinorCurrency(proposal.amountMinor, proposal.currency)}
                </p>
                <p className="text-muted-foreground line-clamp-2 text-sm">{proposal.coverLetter}</p>
                <Link href={`/proposals/${proposal.id}`} className={buttonVariants({ variant: 'outline', size: 'sm' })}>
                  View details
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
