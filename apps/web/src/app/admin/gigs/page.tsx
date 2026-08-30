'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import type { AdminGigSummary, PaginatedResult } from '@magobo/shared';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { LoadingState } from '@/components/magobo/loading-state';
import { ErrorState } from '@/components/magobo/error-state';
import { StatusBadge } from '@/components/magobo/status-badge';
import { apiGet, apiPost } from '@/lib/api-client';

export default function AdminGigsPage() {
  const [result, setResult] = useState<PaginatedResult<AdminGigSummary> | null>(null);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyGigId, setBusyGigId] = useState<string | null>(null);

  const load = useCallback(async (q = query) => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (q.trim()) params.set('q', q.trim());
    const response = await apiGet<PaginatedResult<AdminGigSummary>>(`/api/admin/gigs?${params}`);
    if (!response.success) {
      setError(response.error.message);
      setLoading(false);
      return;
    }
    setResult(response.data);
    setLoading(false);
  }, [query]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  async function handleSuspend(gigId: string) {
    const reason = window.prompt('Reason for suspending this gig (required):');
    if (!reason || reason.trim().length < 5) return;

    setBusyGigId(gigId);
    setActionError(null);
    const response = await apiPost(`/api/admin/gigs/${gigId}/suspend`, { reason: reason.trim() });
    setBusyGigId(null);
    if (!response.success) {
      setActionError(response.error.message);
      return;
    }
    await load();
  }

  if (loading && !result) return <LoadingState page />;
  if (error) return <ErrorState page description={error} onRetry={() => load()} />;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold">Gigs</h2>
        <p className="text-muted-foreground text-sm">Review listings and suspend policy violations.</p>
      </div>

      <form
        className="flex flex-col gap-2 sm:flex-row"
        onSubmit={(event) => {
          event.preventDefault();
          void load(query);
        }}
      >
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by title"
          className="sm:max-w-sm"
        />
        <Button type="submit" variant="secondary">
          Search
        </Button>
      </form>

      {actionError ? <p className="text-destructive text-sm">{actionError}</p> : null}

      {result?.items.length === 0 ? (
        <Card>
          <CardContent className="text-muted-foreground py-8 text-center text-sm">No gigs found.</CardContent>
        </Card>
      ) : (
        result?.items.map((gig) => (
          <Card key={gig.id}>
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle className="text-base">{gig.title}</CardTitle>
                <p className="text-muted-foreground text-sm">
                  {gig.categoryName} · {gig.ownerName}
                </p>
              </div>
              <StatusBadge label={gig.status.replaceAll('_', ' ')} tone="info" />
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Link href={`/gigs/${gig.id}`} className={buttonVariants({ variant: 'outline', size: 'sm' })}>
                View gig
              </Link>
              {gig.status !== 'SUSPENDED' ? (
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={busyGigId === gig.id}
                  onClick={() => handleSuspend(gig.id)}
                >
                  Suspend
                </Button>
              ) : null}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
