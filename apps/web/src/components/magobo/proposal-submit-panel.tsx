'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { submitProposalSchema, type PublicProposal } from '@magobo/shared';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/magobo/form-field';
import { StatusBadge } from '@/components/magobo/status-badge';
import { formatMinorCurrency } from '@/lib/format-money';
import { apiPost } from '@/lib/api-client';

interface ProposalSubmitPanelProps {
  gigId: string;
  currency: string;
  existingProposal: PublicProposal | null;
}

export function ProposalSubmitPanel({ gigId, currency, existingProposal }: ProposalSubmitPanelProps) {
  const router = useRouter();
  const [coverLetter, setCoverLetter] = useState('');
  const [amount, setAmount] = useState('');
  const [estimatedDays, setEstimatedDays] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (existingProposal) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Your proposal</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge tone="info" label={existingProposal.status.replaceAll('_', ' ')} />
            <span className="text-sm font-medium">
              {formatMinorCurrency(existingProposal.amountMinor, existingProposal.currency)}
            </span>
          </div>
          <p className="text-muted-foreground text-sm">{existingProposal.coverLetter}</p>
          <Link href={`/proposals/${existingProposal.id}`} className={buttonVariants({ variant: 'outline', size: 'sm' })}>
            View & negotiate
          </Link>
        </CardContent>
      </Card>
    );
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const amountMinor = Math.round(parseFloat(amount || '0') * 100);

    const parsed = submitProposalSchema.safeParse({
      coverLetter,
      amountMinor,
      currency,
      estimatedDays: estimatedDays ? parseInt(estimatedDays, 10) : undefined,
    });

    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? 'Invalid input.');
      return;
    }

    setSubmitting(true);
    const response = await apiPost<{ proposal: PublicProposal }>(
      `/api/gigs/${gigId}/proposals`,
      parsed.data,
    );
    setSubmitting(false);

    if (!response.success) {
      toast.error(response.error.message);
      return;
    }

    toast.success('Proposal submitted.');
    router.push(`/proposals/${response.data.proposal.id}`);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Submit a proposal</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <FormField id="coverLetter" label="Cover letter">
            <textarea
              id="coverLetter"
              className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-[120px] w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
              value={coverLetter}
              onChange={(event) => setCoverLetter(event.target.value)}
              placeholder="Explain your experience, approach, and why you're a good fit."
              required
            />
          </FormField>
          <FormField id="amount" label={`Proposed amount (${currency})`}>
            <Input
              id="amount"
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder="1500"
              required
            />
          </FormField>
          <FormField id="estimatedDays" label="Estimated days (optional)">
            <Input
              id="estimatedDays"
              type="number"
              min="1"
              value={estimatedDays}
              onChange={(event) => setEstimatedDays(event.target.value)}
              placeholder="7"
            />
          </FormField>
          <Button type="submit" disabled={submitting}>
            Submit proposal
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
