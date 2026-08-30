'use client';

import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { toast } from 'sonner';
import { sendMessageSchema, type PublicConversation, type PublicMessage } from '@magobo/shared';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormField } from '@/components/magobo/form-field';
import { LoadingState } from '@/components/magobo/loading-state';
import { ErrorState } from '@/components/magobo/error-state';
import { apiGet, apiPost } from '@/lib/api-client';
import { useCurrentUser } from '@/lib/use-current-user';

export default function ConversationPage() {
  const params = useParams<{ id: string }>();
  const { user } = useCurrentUser();
  const [conversation, setConversation] = useState<PublicConversation | null>(null);
  const [messages, setMessages] = useState<PublicMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    if (!params.id) return;
    setLoading(true);
    const response = await apiGet<{
      conversation: PublicConversation;
      messages: { items: PublicMessage[] };
    }>(`/api/conversations/${params.id}`);
    if (!response.success) {
      setError(response.error.message);
      setLoading(false);
      return;
    }
    setConversation(response.data.conversation);
    setMessages(response.data.messages.items);
    setLoading(false);
  }, [params.id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSend(event: FormEvent) {
    event.preventDefault();
    const parsed = sendMessageSchema.safeParse({ body });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? 'Invalid message.');
      return;
    }

    setSending(true);
    const response = await apiPost<{ message: PublicMessage }>(
      `/api/conversations/${params.id}/messages`,
      parsed.data,
    );
    setSending(false);

    if (!response.success) {
      toast.error(response.error.message);
      return;
    }

    setBody('');
    setMessages((current) => [...current, response.data.message]);
  }

  if (loading) return <LoadingState />;
  if (error) return <ErrorState description={error} onRetry={load} />;
  if (!conversation) return null;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold tracking-tight">{conversation.gig.title}</h1>
          <p className="text-muted-foreground text-sm">
            with {conversation.otherParticipant.fullName}
          </p>
        </div>
        <Link href="/messages" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
          Inbox
        </Link>
      </div>

      <Card className="flex min-h-[420px] flex-col">
        <CardHeader className="border-b pb-3">
          <CardTitle className="text-base">Conversation</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col gap-4 pt-4">
          <div className="flex max-h-[480px] flex-1 flex-col gap-3 overflow-y-auto">
            {messages.length === 0 ? (
              <p className="text-muted-foreground text-sm">No messages yet. Say hello.</p>
            ) : (
              messages.map((message) => {
                const isMine = message.senderUserId === user?.id;
                return (
                  <div
                    key={message.id}
                    className={`max-w-[85%] rounded-lg border px-3 py-2 text-sm ${
                      isMine ? 'bg-primary/5 ml-auto' : 'bg-muted/30'
                    }`}
                  >
                    <div className="mb-1 flex items-center justify-between gap-3">
                      <span className="font-medium">{isMine ? 'You' : message.senderName}</span>
                      <span className="text-muted-foreground text-xs">
                        {new Date(message.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="leading-relaxed whitespace-pre-wrap">{message.body}</p>
                    {message.attachments.map((attachment) => (
                      <a
                        key={attachment.id}
                        href={attachment.downloadUrl}
                        className="text-primary mt-2 block text-xs underline-offset-4 hover:underline"
                        target="_blank"
                        rel="noreferrer"
                      >
                        {attachment.originalFileName}
                      </a>
                    ))}
                  </div>
                );
              })
            )}
            <div ref={bottomRef} />
          </div>

          {conversation.canSend ? (
            <form className="flex flex-col gap-3 border-t pt-4" onSubmit={handleSend}>
              <FormField id="body" label="Message">
                <textarea
                  id="body"
                  className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-[80px] w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                  value={body}
                  onChange={(event) => setBody(event.target.value)}
                  placeholder="Keep communication on Magobo — off-platform contact may be flagged."
                  required
                />
              </FormField>
              <Button type="submit" disabled={sending}>
                Send
              </Button>
            </form>
          ) : (
            <p className="text-muted-foreground border-t pt-4 text-sm">
              This conversation is read-only.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
