'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import type { PublicGig, PublicProposal } from '@magobo/shared';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/magobo/status-badge';
import { VerificationBadge } from '@/components/magobo/verification-badge';
import { LoadingState } from '@/components/magobo/loading-state';
import { ErrorState } from '@/components/magobo/error-state';
import { GigProposalsPanel } from '@/components/magobo/gig-proposals-panel';
import { ProposalSubmitPanel } from '@/components/magobo/proposal-submit-panel';
import { apiGet, apiPost } from '@/lib/api-client';
import { useCurrentUser } from '@/lib/use-current-user';
import { formatGigBudget } from '@/lib/format-money';

export default function GigDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useCurrentUser();
  const [gig, setGig] = useState<PublicGig | null>(null);
  const [proposals, setProposals] = useState<PublicProposal[]>([]);
  const [myProposal, setMyProposal] = useState<PublicProposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [acting, setActing] = useState(false);

  const load = useCallback(async () => {
    if (!params.id) return;
    setLoading(true);
    const response = await apiGet<{ gig: PublicGig }>(`/api/gigs/${params.id}`);
    if (!response.success) {
      setError(response.error.message);
      setLoading(false);
      return;
    }
    setGig(response.data.gig);

    const isOwner = user?.id === response.data.gig.owner.userId;
    const isProvider = user?.roles.includes('SERVICE_PROVIDER');
    const openForProposals = ['RECEIVING_PROPOSALS', 'NEGOTIATING'].includes(response.data.gig.status);

    if (isOwner && openForProposals) {
      const proposalsResponse = await apiGet<{ items: PublicProposal[] }>(
        `/api/gigs/${params.id}/proposals`,
      );
      if (proposalsResponse.success) setProposals(proposalsResponse.data.items);
    }

    if (isProvider && !isOwner && openForProposals) {
      const mineResponse = await apiGet<{ proposal: PublicProposal | null }>(
        `/api/gigs/${params.id}/proposals?mine=true`,
      );
      if (mineResponse.success) setMyProposal(mineResponse.data.proposal);
    }

    setLoading(false);
  }, [params.id, user?.id, user?.roles]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load, user?.id]);

  const isOwner = user?.id === gig?.owner.userId;
  const isProvider = user?.roles.includes('SERVICE_PROVIDER');
  const openForProposals = gig && ['RECEIVING_PROPOSALS', 'NEGOTIATING'].includes(gig.status);

  async function publish() {
    if (!params.id) return;
    setActing(true);
    const response = await apiPost(`/api/gigs/${params.id}/publish`, {});
    setActing(false);
    if (!response.success) {
      toast.error(response.error.message);
      return;
    }
    toast.success('Gig published.');
    await load();
  }

  async function cancel() {
    if (!params.id) return;
    setActing(true);
    const response = await apiPost(`/api/gigs/${params.id}/cancel`, {});
    setActing(false);
    if (!response.success) {
      toast.error(response.error.message);
      return;
    }
    toast.success('Gig cancelled.');
    router.push('/my/gigs');
  }

  if (loading) return <LoadingState />;
  if (error) return <ErrorState description={error} onRetry={load} />;
  if (!gig) return null;

  const location = [gig.location.city, gig.location.country].filter(Boolean).join(', ') || 'Flexible';

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge tone="info" label={gig.status.replaceAll('_', ' ')} />
            <span className="text-muted-foreground text-sm">{gig.category.name}</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">{gig.title}</h1>
        </div>
        <Link href="/gigs" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
          Back
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{gig.description}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <p className="text-muted-foreground text-xs">Budget</p>
              <p className="font-medium">{formatGigBudget(gig.budget.minMinor, gig.budget.maxMinor, gig.budget.currency)}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Location</p>
              <p className="font-medium">{location}</p>
            </div>
            {gig.deadlineAt && (
              <div>
                <p className="text-muted-foreground text-xs">Deadline</p>
                <p className="font-medium">{new Date(gig.deadlineAt).toLocaleDateString()}</p>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 border-t pt-4">
            <span className="text-sm font-medium">{gig.owner.fullName}</span>
            {gig.owner.kycVerified && <VerificationBadge state="verified" showLabel />}
          </div>
        </CardContent>
      </Card>

      {gig.attachments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Attachments</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {gig.attachments.map((attachment) => (
              <a
                key={attachment.id}
                href={attachment.downloadUrl}
                className="text-primary block text-sm underline-offset-4 hover:underline"
                target="_blank"
                rel="noreferrer"
              >
                {attachment.originalFileName}
              </a>
            ))}
          </CardContent>
        </Card>
      )}

      {isOwner && openForProposals && (
        <GigProposalsPanel
          proposals={proposals}
          acting={acting}
          setActing={setActing}
          onAction={load}
        />
      )}

      {isProvider && !isOwner && openForProposals && (
        <ProposalSubmitPanel
          gigId={gig.id}
          currency={gig.budget.currency}
          existingProposal={myProposal}
        />
      )}

      {isOwner && (
        <div className="flex flex-wrap gap-2">
          {gig.status === 'DRAFT' && (
            <>
              <Link href={`/gigs/${gig.id}/edit`} className={buttonVariants({ variant: 'outline' })}>
                Edit draft
              </Link>
              <Button onClick={publish} disabled={acting}>
                Publish
              </Button>
            </>
          )}
          {(gig.status === 'DRAFT' || gig.status === 'RECEIVING_PROPOSALS' || gig.status === 'NEGOTIATING') && (
            <Button variant="destructive" onClick={cancel} disabled={acting}>
              Cancel gig
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
