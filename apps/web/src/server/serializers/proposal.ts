import type { Gig, Proposal, ProposalNegotiationEntry, User } from '@magobo/db';
import type {
  NegotiationEntry,
  ProposalGigSummary,
  ProposalProviderSummary,
  PublicProposal,
} from '@magobo/shared';

type ProposalWithRelations = Proposal & {
  provider: User & { kycCase?: { status: string } | null };
  gig?: Pick<Gig, 'id' | 'title' | 'status' | 'ownerUserId'>;
  negotiationEntries: (ProposalNegotiationEntry & { author: User })[];
};

export function toProposalProviderSummary(
  provider: ProposalWithRelations['provider'],
): ProposalProviderSummary {
  return {
    userId: provider.id,
    fullName: provider.fullName,
    kycVerified: provider.kycCase?.status === 'VERIFIED',
  };
}

function toProposalGigSummary(gig: NonNullable<ProposalWithRelations['gig']>): ProposalGigSummary {
  return {
    id: gig.id,
    title: gig.title,
    status: gig.status,
    ownerUserId: gig.ownerUserId,
  };
}

function toNegotiationEntry(
  entry: ProposalNegotiationEntry & { author: User },
  currency: string,
): NegotiationEntry {
  return {
    id: entry.id,
    authorUserId: entry.authorUserId,
    authorName: entry.author.fullName,
    message: entry.message,
    amountMinor: entry.amountMinor,
    currency: entry.amountMinor !== null ? currency : null,
    createdAt: entry.createdAt.toISOString(),
  };
}

export function toPublicProposal(proposal: ProposalWithRelations): PublicProposal {
  return {
    id: proposal.id,
    gigId: proposal.gigId,
    status: proposal.status,
    coverLetter: proposal.coverLetter,
    amountMinor: proposal.amountMinor,
    currency: proposal.currency,
    estimatedDays: proposal.estimatedDays,
    provider: toProposalProviderSummary(proposal.provider),
    gig: proposal.gig ? toProposalGigSummary(proposal.gig) : undefined,
    negotiationEntries: proposal.negotiationEntries.map((entry) =>
      toNegotiationEntry(entry, proposal.currency),
    ),
    createdAt: proposal.createdAt.toISOString(),
    updatedAt: proposal.updatedAt.toISOString(),
  };
}
