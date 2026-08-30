'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { ConversationSummary } from '@magobo/shared';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingState } from '@/components/magobo/loading-state';
import { ErrorState } from '@/components/magobo/error-state';
import { EmptyState } from '@/components/magobo/empty-state';
import { apiGet } from '@/lib/api-client';
import { useCurrentUser } from '@/lib/use-current-user';

export default function MessagesInboxPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useCurrentUser();
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const response = await apiGet<{ items: ConversationSummary[] }>('/api/conversations');
    if (!response.success) {
      setError(response.error.message);
      setLoading(false);
      return;
    }
    setConversations(response.data.items);
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
        <h1 className="text-2xl font-semibold tracking-tight">Messages</h1>
        <Link href="/gigs" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
          Browse gigs
        </Link>
      </div>

      {conversations.length === 0 ? (
        <EmptyState
          title="No conversations yet"
          description="Messages open automatically when you submit or receive a proposal."
        />
      ) : (
        <div className="space-y-3">
          {conversations.map((conversation) => (
            <Link key={conversation.id} href={`/messages/${conversation.id}`}>
              <Card className="transition-colors hover:bg-muted/40">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{conversation.gig.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1">
                  <p className="text-sm font-medium">{conversation.otherParticipant.fullName}</p>
                  <p className="text-muted-foreground text-xs">
                    {conversation.lastMessageAt
                      ? `Last message ${new Date(conversation.lastMessageAt).toLocaleString()}`
                      : 'No messages yet'}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
