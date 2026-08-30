'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { NotificationSummary, PaginatedResult } from '@magobo/shared';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingState } from '@/components/magobo/loading-state';
import { ErrorState } from '@/components/magobo/error-state';
import { EmptyState } from '@/components/magobo/empty-state';
import { apiGet, apiPost } from '@/lib/api-client';
import { useCurrentUser } from '@/lib/use-current-user';
import { cn } from '@/lib/utils';

export default function NotificationsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useCurrentUser();
  const [result, setResult] = useState<PaginatedResult<NotificationSummary> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const response = await apiGet<PaginatedResult<NotificationSummary>>('/api/notifications');
    if (!response.success) {
      setError(response.error.message);
      setLoading(false);
      return;
    }
    setResult(response.data);
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

  async function handleMarkAllRead() {
    setMarkingAll(true);
    const response = await apiPost('/api/notifications/read-all', {});
    setMarkingAll(false);
    if (!response.success) {
      setError(response.error.message);
      return;
    }
    await load();
  }

  async function handleOpen(notification: NotificationSummary) {
    if (!notification.readAt) {
      await apiPost(`/api/notifications/${notification.id}/read`, {});
    }
    if (notification.actionHref) {
      router.push(notification.actionHref);
      return;
    }
    await load();
  }

  if (authLoading || loading) return <LoadingState page />;
  if (error) return <ErrorState page description={error} onRetry={load} />;

  const unreadCount = result?.items.filter((item) => !item.readAt).length ?? 0;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground text-sm">Updates about proposals, messages, and projects.</p>
        </div>
        {unreadCount > 0 ? (
          <Button variant="outline" size="sm" disabled={markingAll} onClick={handleMarkAllRead}>
            Mark all read
          </Button>
        ) : null}
      </div>

      {result?.items.length === 0 ? (
        <EmptyState
          title="No notifications yet"
          description="When something happens on your gigs or proposals, you'll see it here."
          action={
            <Link href="/gigs" className={buttonVariants({ size: 'sm' })}>
              Browse gigs
            </Link>
          }
        />
      ) : (
        result?.items.map((notification) => (
          <Card
            key={notification.id}
            className={cn(!notification.readAt && 'border-primary/30 bg-primary/5')}
          >
            <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <CardTitle className="text-base">{notification.title}</CardTitle>
              <time className="text-muted-foreground shrink-0 text-xs">
                {new Date(notification.createdAt).toLocaleString()}
              </time>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <p className="text-sm">{notification.body}</p>
              <div className="flex flex-wrap gap-2">
                {notification.actionHref ? (
                  <Button size="sm" variant="secondary" onClick={() => handleOpen(notification)}>
                    View
                  </Button>
                ) : !notification.readAt ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      await apiPost(`/api/notifications/${notification.id}/read`, {});
                      await load();
                    }}
                  >
                    Mark read
                  </Button>
                ) : null}
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
