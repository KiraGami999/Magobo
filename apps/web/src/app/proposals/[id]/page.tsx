'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { toast } from 'sonner';
import { counterOfferSchema, type PublicConversation, type PublicProposal } from '@magobo/shared';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/magobo/form-field';
import { StatusBadge } from '@/components/magobo/status-badge';
import { VerificationBadge } from '@/components/magobo/verification-badge';
import { LoadingState } from '@/components/magobo/loading-state';
import { ErrorState } from '@/components/magobo/error-state';
import { formatMinorCurrency } from '@/lib/format-money';
import { apiGet, apiPost } from '@/lib/api-client';
import { useCurrentUser } from '@/lib/use-current-user';

export default function ProposalDetailPage() {
  const params = useParams<{ id: string }>();
  const { user } = useCurrentUser();
  const [proposal, setProposal] = useState<PublicProposal | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [acting, setActing] = useState(false);
  const [message, setMessage] = useState('');
  const [counterAmount, setCounterAmount] = useState('');

  const load = useCallback(async () => {
    if (!params.id) return;
    setLoading(true);
    const response = await apiGet<{ proposal: PublicProposal }>(`/api/proposals/${params.id}`);
    if (!response.success) {
      setError(response.error.message);
      setLoading(false);
      return;
    }
    setProposal(response.data.proposal);

    const conversationResponse = await apiGet<{ conversation: PublicConversation }>(
      `/api/proposals/${params.id}/conversation`,
    );
    if (conversationResponse.success) {
      setConversationId(conversationResponse.data.conversation.id);
    }

    setLoading(false);
  }, [params.id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const isOwner = user?.id === proposal?.gig?.ownerUserId;
  const isProvider = user?.id === proposal?.provider.userId;
  const isActive = proposal && ['SUBMITTED', 'SHORTLISTED', 'NEGOTIATING'].includes(proposal.status);

  async function runAction(path: string, body: Record<string, unknown>, successMessage: string) {
    setActing(true);
    const response = await apiPost(path, body);
    setActing(false);
    if (!response.success) {
      toast.error(response.error.message);
      return;
    }
    toast.success(successMessage);
    setMessage('');
    setCounterAmount('');
    await load();
  }

  async function handleNegotiate(event: FormEvent) {
    event.preventDefault();
    const amountMinor = counterAmount ? Math.round(parseFloat(counterAmount) * 100) : undefined;
    const parsed = counterOfferSchema.safeParse({ message, amountMinor });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? 'Invalid input.');
      return;
    }
    await runAction(`/api/proposals/${params.id}/negotiate`, parsed.data, 'Counter-offer sent.');
  }

  if (loading) return <LoadingState />;
  if (error) return <ErrorState description={error} onRetry={load} />;
  if (!proposal) return null;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <StatusBadge tone="info" label={proposal.status.replaceAll('_', ' ')} />
          <h1 className="text-2xl font-semibold tracking-tight">Proposal</h1>
          {proposal.gig && (
            <Link href={`/gigs/${proposal.gig.id}`} className="text-primary text-sm hover:underline">
              {proposal.gig.title}
            </Link>
          )}
        </div>
        <Link href={proposal.gig ? `/gigs/${proposal.gig.id}` : '/gigs'} className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
          Back
        </Link>
      </div>

      {conversationId && (
        <Link href={`/messages/${conversationId}`} className={buttonVariants({ variant: 'outline', size: 'sm' })}>
          Open messages
        </Link>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium">{proposal.provider.fullName}</span>
            {proposal.provider.kycVerified && <VerificationBadge state="verified" />}
          </div>
          <p className="font-medium">
            {formatMinorCurrency(proposal.amountMinor, proposal.currency)}
            {proposal.estimatedDays ? ` · ${proposal.estimatedDays} days estimated` : ''}
          </p>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{proposal.coverLetter}</p>
        </CardContent>
      </Card>

      {proposal.negotiationEntries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Negotiation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {proposal.negotiationEntries.map((entry) => (
              <div key={entry.id} className="rounded-lg border p-3">
                <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-medium">{entry.authorName}</span>
                  <span className="text-muted-foreground text-xs">
                    {new Date(entry.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm">{entry.message}</p>
                {entry.amountMinor !== null && (
                  <p className="text-muted-foreground mt-1 text-sm">
                    Counter: {formatMinorCurrency(entry.amountMinor, entry.currency ?? proposal.currency)}
                  </p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {isActive && (isOwner || isProvider) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Send counter-offer</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleNegotiate}>
              <FormField id="message" label="Message">
                <textarea
                  id="message"
                  className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-[80px] w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  required
                />
              </FormField>
              <FormField id="counterAmount" label={`New amount (${proposal.currency}, optional)`}>
                <Input
                  id="counterAmount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={counterAmount}
                  onChange={(event) => setCounterAmount(event.target.value)}
                />
              </FormField>
              <Button type="submit" disabled={acting}>
                Send counter-offer
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {isActive && (
        <div className="flex flex-wrap gap-2">
          {isOwner && (
            <>
              {proposal.status === 'SUBMITTED' && (
                <Button
                  variant="outline"
                  disabled={acting}
                  onClick={() => runAction(`/api/proposals/${proposal.id}/shortlist`, {}, 'Shortlisted.')}
                >
                  Shortlist
                </Button>
              )}
              <Button
                disabled={acting}
                onClick={() => runAction(`/api/proposals/${proposal.id}/accept`, {}, 'Proposal accepted.')}
              >
                Accept
              </Button>
              <Button
                variant="destructive"
                disabled={acting}
                onClick={() => runAction(`/api/proposals/${proposal.id}/reject`, {}, 'Proposal rejected.')}
              >
                Reject
              </Button>
            </>
          )}
          {isProvider && (
            <Button
              variant="destructive"
              disabled={acting}
              onClick={() => runAction(`/api/proposals/${proposal.id}/withdraw`, {}, 'Proposal withdrawn.')}
            >
              Withdraw
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
