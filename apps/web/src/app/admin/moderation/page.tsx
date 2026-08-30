'use client';

import { useCallback, useEffect, useState } from 'react';
import type { AdminFlaggedMessageSummary } from '@magobo/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingState } from '@/components/magobo/loading-state';
import { ErrorState } from '@/components/magobo/error-state';
import { apiGet, apiPost } from '@/lib/api-client';

export default function AdminModerationPage() {
  const [messages, setMessages] = useState<AdminFlaggedMessageSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyMessageId, setBusyMessageId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const response = await apiGet<{ messages: AdminFlaggedMessageSummary[] }>(
      '/api/admin/moderation/flagged-messages',
    );
    if (!response.success) {
      setError(response.error.message);
      setLoading(false);
      return;
    }
    setMessages(response.data.messages);
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  async function handleClear(messageId: string) {
    setBusyMessageId(messageId);
    setActionError(null);
    const response = await apiPost(`/api/admin/moderation/messages/${messageId}/clear`, {});
    setBusyMessageId(null);
    if (!response.success) {
      setActionError(response.error.message);
      return;
    }
    await load();
  }

  if (loading) return <LoadingState />;
  if (error) return <ErrorState description={error} onRetry={load} />;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold">Moderation</h2>
        <p className="text-muted-foreground text-sm">Messages flagged for off-platform or policy concerns.</p>
      </div>

      {actionError ? <p className="text-destructive text-sm">{actionError}</p> : null}

      {messages.length === 0 ? (
        <Card>
          <CardContent className="text-muted-foreground py-8 text-center text-sm">No flagged messages.</CardContent>
        </Card>
      ) : (
        messages.map((message) => (
          <Card key={message.id}>
            <CardHeader>
              <CardTitle className="text-base">{message.gigTitle ?? 'Conversation'}</CardTitle>
              <p className="text-muted-foreground text-sm">
                {message.senderName} · {new Date(message.createdAt).toLocaleString()}
              </p>
              {message.moderationFlags.length > 0 ? (
                <p className="text-muted-foreground text-xs">Flags: {message.moderationFlags.join(', ')}</p>
              ) : null}
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <p className="rounded-md bg-muted p-3 text-sm">{message.body}</p>
              <Button
                size="sm"
                variant="secondary"
                disabled={busyMessageId === message.id}
                onClick={() => handleClear(message.id)}
              >
                Clear flag
              </Button>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
