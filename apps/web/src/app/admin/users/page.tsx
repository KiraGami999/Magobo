'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import type { AdminUserSummary, PaginatedResult } from '@magobo/shared';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { LoadingState } from '@/components/magobo/loading-state';
import { ErrorState } from '@/components/magobo/error-state';
import { StatusBadge } from '@/components/magobo/status-badge';
import { apiGet, apiPost } from '@/lib/api-client';

export default function AdminUsersPage() {
  const [result, setResult] = useState<PaginatedResult<AdminUserSummary> | null>(null);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyUserId, setBusyUserId] = useState<string | null>(null);

  const load = useCallback(async (q = query) => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (q.trim()) params.set('q', q.trim());
    const response = await apiGet<PaginatedResult<AdminUserSummary>>(`/api/admin/users?${params}`);
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

  async function handleSuspend(userId: string) {
    const reason = window.prompt('Reason for suspension (required):');
    if (!reason || reason.trim().length < 5) return;

    setBusyUserId(userId);
    setActionError(null);
    const response = await apiPost(`/api/admin/users/${userId}/suspend`, { reason: reason.trim() });
    setBusyUserId(null);
    if (!response.success) {
      setActionError(response.error.message);
      return;
    }
    await load();
  }

  async function handleReactivate(userId: string) {
    setBusyUserId(userId);
    setActionError(null);
    const response = await apiPost(`/api/admin/users/${userId}/reactivate`, {});
    setBusyUserId(null);
    if (!response.success) {
      setActionError(response.error.message);
      return;
    }
    await load();
  }

  if (loading && !result) return <LoadingState />;
  if (error) return <ErrorState description={error} onRetry={() => load()} />;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold">Users</h2>
        <p className="text-muted-foreground text-sm">Search accounts and manage suspensions.</p>
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
          placeholder="Search by name or email"
          className="sm:max-w-sm"
        />
        <Button type="submit" variant="secondary">
          Search
        </Button>
      </form>

      {actionError ? <p className="text-destructive text-sm">{actionError}</p> : null}

      {result?.items.length === 0 ? (
        <Card>
          <CardContent className="text-muted-foreground py-8 text-center text-sm">No users found.</CardContent>
        </Card>
      ) : (
        result?.items.map((entry) => (
          <Card key={entry.id}>
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle className="text-base">{entry.fullName}</CardTitle>
                <p className="text-muted-foreground text-sm">{entry.email ?? entry.phone ?? 'No contact'}</p>
                <p className="text-muted-foreground mt-1 text-xs">{entry.roles.join(', ')}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge label={entry.status.replaceAll('_', ' ')} />
                {entry.kycStatus ? <StatusBadge label={entry.kycStatus.replaceAll('_', ' ')} tone="info" /> : null}
              </div>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Link href={`/users/${entry.id}`} className={buttonVariants({ variant: 'outline', size: 'sm' })}>
                View profile
              </Link>
              {entry.status === 'SUSPENDED' ? (
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={busyUserId === entry.id}
                  onClick={() => handleReactivate(entry.id)}
                >
                  Reactivate
                </Button>
              ) : !entry.roles.includes('ADMIN') ? (
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={busyUserId === entry.id}
                  onClick={() => handleSuspend(entry.id)}
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
