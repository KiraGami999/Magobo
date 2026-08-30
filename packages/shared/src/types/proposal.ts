export interface ProposalProviderSummary {
  userId: string;
  fullName: string;
  kycVerified: boolean;
}

export interface ProposalGigSummary {
  id: string;
  title: string;
  status: string;
  ownerUserId: string;
}

export interface NegotiationEntry {
  id: string;
  authorUserId: string;
  authorName: string;
  message: string;
  amountMinor: number | null;
  currency: string | null;
  createdAt: string;
}

/** Public proposal — safe fields for authorized viewers only. */
export interface PublicProposal {
  id: string;
  gigId: string;
  status: string;
  coverLetter: string;
  amountMinor: number;
  currency: string;
  estimatedDays: number | null;
  provider: ProposalProviderSummary;
  gig?: ProposalGigSummary;
  negotiationEntries: NegotiationEntry[];
  createdAt: string;
  updatedAt: string;
}
