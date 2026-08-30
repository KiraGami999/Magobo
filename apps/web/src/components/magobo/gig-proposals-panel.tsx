'use client';

import Link from 'next/link';
import { toast } from 'sonner';
import type { PublicProposal } from '@magobo/shared';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/magobo/status-badge';
import { VerificationBadge } from '@/components/magobo/verification-badge';
import { formatMinorCurrency } from '@/lib/format-money';
import { apiPost } from '@/lib/api-client';

interface GigProposalsPanelProps {
  proposals: PublicProposal[];
  acting: boolean;
  onAction: () => Promise<void>;
  setActing: (value: boolean) => void;
}

export function GigProposalsPanel({
  proposals,
  acting,
  onAction,
  setActing,
}: GigProposalsPanelProps) {
  async function runAction(path: string, successMessage: string) {
    setActing(true);
    const response = await apiPost(path, {});
    setActing(false);
    if (!response.success) {
      toast.error(response.error.message);
      return;
    }
    toast.success(successMessage);
    await onAction();
  }

  if (proposals.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Proposals</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">No proposals yet. Share your gig to attract providers.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Proposals ({proposals.length})</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {proposals.map((proposal) => {
          const isActive = ['SUBMITTED', 'SHORTLISTED', 'NEGOTIATING'].includes(proposal.status);
          return (
            <div key={proposal.id} className="space-y-3 rounded-lg border p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{proposal.provider.fullName}</span>
                    {proposal.provider.kycVerified && <VerificationBadge state="verified" />}
                    <StatusBadge tone="info" label={proposal.status.replaceAll('_', ' ')} />
                  </div>
                  <p className="text-sm font-medium">
                    {formatMinorCurrency(proposal.amountMinor, proposal.currency)}
                    {proposal.estimatedDays ? ` · ${proposal.estimatedDays} days` : ''}
                  </p>
                </div>
                <Link
                  href={`/proposals/${proposal.id}`}
                  className={buttonVariants({ variant: 'outline', size: 'sm' })}
                >
                  View
                </Link>
              </div>
              <p className="text-muted-foreground line-clamp-3 text-sm">{proposal.coverLetter}</p>
              {isActive && (
                <div className="flex flex-wrap gap-2">
                  {proposal.status === 'SUBMITTED' && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={acting}
                      onClick={() => runAction(`/api/proposals/${proposal.id}/shortlist`, 'Shortlisted.')}
                    >
                      Shortlist
                    </Button>
                  )}
                  <Button
                    size="sm"
                    disabled={acting}
                    onClick={() => runAction(`/api/proposals/${proposal.id}/accept`, 'Proposal accepted.')}
                  >
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={acting}
                    onClick={() => runAction(`/api/proposals/${proposal.id}/reject`, 'Proposal rejected.')}
                  >
                    Reject
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
