import 'server-only';
import { prisma, type GigStatus, type ProposalStatus, type User } from '@magobo/db';
import type {
  CounterOfferInput,
  ListProposalsInput,
  PaginatedResult,
  SubmitProposalInput,
} from '@magobo/shared';
import { ConflictError, NotFoundError, UnauthorizedError } from '@/server/errors';
import { requireOwnership, requireRole } from '@/server/auth/guards';
import { notificationProvider } from '@/server/providers/notification';
import { createConversationForProposal } from '@/server/services/message.service';
import { toPublicProposal } from '@/server/serializers/proposal';

const proposalInclude = {
  provider: { include: { kycCase: { select: { status: true } } } },
  gig: { select: { id: true, title: true, status: true, ownerUserId: true } },
  negotiationEntries: {
    include: { author: true },
    orderBy: { createdAt: 'asc' as const },
  },
} as const;

const OPEN_GIG_STATUSES: GigStatus[] = ['RECEIVING_PROPOSALS', 'NEGOTIATING'];
const ACTIVE_PROPOSAL_STATUSES: ProposalStatus[] = ['SUBMITTED', 'SHORTLISTED', 'NEGOTIATING'];

function assertProposalTransition(
  current: ProposalStatus,
  next: ProposalStatus,
  action: string,
): void {
  const allowed: Partial<Record<ProposalStatus, ProposalStatus[]>> = {
    SUBMITTED: ['SHORTLISTED', 'NEGOTIATING', 'ACCEPTED', 'REJECTED', 'WITHDRAWN'],
    SHORTLISTED: ['NEGOTIATING', 'ACCEPTED', 'REJECTED', 'WITHDRAWN'],
    NEGOTIATING: ['ACCEPTED', 'REJECTED', 'WITHDRAWN'],
  };

  const permitted = allowed[current];
  if (!permitted?.includes(next)) {
    throw new ConflictError(`Cannot ${action} a proposal in ${current} status.`);
  }
}

function assertGigOpenForProposals(status: GigStatus): void {
  if (!OPEN_GIG_STATUSES.includes(status)) {
    throw new ConflictError('This gig is not accepting proposals.');
  }
}

async function getProposalOrThrow(proposalId: string) {
  const proposal = await prisma.proposal.findUnique({
    where: { id: proposalId },
    include: proposalInclude,
  });

  if (!proposal) throw new NotFoundError('Proposal');
  return proposal;
}

function canViewProposal(user: User | undefined, proposal: Awaited<ReturnType<typeof getProposalOrThrow>>): boolean {
  if (!user) return false;
  if (user.roles.includes('ADMIN')) return true;
  if (user.id === proposal.providerUserId) return true;
  if (user.id === proposal.gig?.ownerUserId) return true;
  return false;
}

function assertCanViewProposal(user: User, proposal: Awaited<ReturnType<typeof getProposalOrThrow>>): void {
  if (!canViewProposal(user, proposal)) {
    throw new UnauthorizedError();
  }
}

export async function submitProposal(user: User, gigId: string, input: SubmitProposalInput) {
  requireRole(user, 'SERVICE_PROVIDER');

  if (user.status !== 'ACTIVE') {
    throw new UnauthorizedError('Verify your account before submitting proposals.');
  }

  const gig = await prisma.gig.findFirst({
    where: { id: gigId, deletedAt: null },
  });

  if (!gig) throw new NotFoundError('Gig');
  assertGigOpenForProposals(gig.status);

  if (gig.ownerUserId === user.id) {
    throw new ConflictError('You cannot submit a proposal on your own gig.');
  }

  const existing = await prisma.proposal.findUnique({
    where: { gigId_providerUserId: { gigId, providerUserId: user.id } },
  });

  if (existing) {
    throw new ConflictError('You have already submitted a proposal on this gig.');
  }

  const proposal = await prisma.proposal.create({
    data: {
      gigId,
      providerUserId: user.id,
      coverLetter: input.coverLetter,
      amountMinor: input.amountMinor,
      currency: input.currency ?? gig.currency,
      estimatedDays: input.estimatedDays,
      status: 'SUBMITTED',
    },
    include: proposalInclude,
  });

  await createConversationForProposal({
    gigId,
    proposalId: proposal.id,
    ownerUserId: gig.ownerUserId,
    providerUserId: user.id,
  });

  await notificationProvider.notify({
    event: 'PROPOSAL_SUBMITTED',
    recipientUserId: gig.ownerUserId,
    title: 'New proposal received',
    body: `${user.fullName} submitted a proposal on "${gig.title}".`,
    metadata: { gigId, proposalId: proposal.id },
  });

  return toPublicProposal(proposal);
}

export async function getProposal(proposalId: string, viewer?: User) {
  const proposal = await getProposalOrThrow(proposalId);

  if (!viewer) throw new UnauthorizedError();
  assertCanViewProposal(viewer, proposal);

  return toPublicProposal(proposal);
}

export async function listGigProposals(user: User, gigId: string, input: ListProposalsInput) {
  const gig = await prisma.gig.findFirst({
    where: { id: gigId, deletedAt: null },
  });

  if (!gig) throw new NotFoundError('Gig');
  requireOwnership(user, gig.ownerUserId);

  const page = input.page ?? 1;
  const pageSize = input.pageSize ?? 20;
  const skip = (page - 1) * pageSize;

  const where = { gigId };

  const [totalItems, proposals] = await Promise.all([
    prisma.proposal.count({ where }),
    prisma.proposal.findMany({
      where,
      include: proposalInclude,
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
    }),
  ]);

  return {
    items: proposals.map((proposal) => toPublicProposal(proposal)),
    page,
    pageSize,
    totalItems,
    totalPages: Math.ceil(totalItems / pageSize) || 1,
  } satisfies PaginatedResult<ReturnType<typeof toPublicProposal>>;
}

export async function listMyProposals(user: User, input: ListProposalsInput) {
  requireRole(user, 'SERVICE_PROVIDER');

  const page = input.page ?? 1;
  const pageSize = input.pageSize ?? 20;
  const skip = (page - 1) * pageSize;

  const where = { providerUserId: user.id };

  const [totalItems, proposals] = await Promise.all([
    prisma.proposal.count({ where }),
    prisma.proposal.findMany({
      where,
      include: proposalInclude,
      orderBy: { updatedAt: 'desc' },
      skip,
      take: pageSize,
    }),
  ]);

  return {
    items: proposals.map((proposal) => toPublicProposal(proposal)),
    page,
    pageSize,
    totalItems,
    totalPages: Math.ceil(totalItems / pageSize) || 1,
  } satisfies PaginatedResult<ReturnType<typeof toPublicProposal>>;
}

export async function shortlistProposal(user: User, proposalId: string) {
  const proposal = await getProposalOrThrow(proposalId);
  requireOwnership(user, proposal.gig!.ownerUserId);
  assertGigOpenForProposals(proposal.gig!.status as GigStatus);
  assertProposalTransition(proposal.status, 'SHORTLISTED', 'shortlist');

  const updated = await prisma.proposal.update({
    where: { id: proposalId },
    data: { status: 'SHORTLISTED' },
    include: proposalInclude,
  });

  await notificationProvider.notify({
    event: 'PROPOSAL_SHORTLISTED',
    recipientUserId: proposal.providerUserId,
    title: 'Proposal shortlisted',
    body: `Your proposal on "${proposal.gig!.title}" was shortlisted.`,
    metadata: { gigId: proposal.gigId, proposalId },
  });

  return toPublicProposal(updated);
}

export async function rejectProposal(user: User, proposalId: string) {
  const proposal = await getProposalOrThrow(proposalId);
  requireOwnership(user, proposal.gig!.ownerUserId);
  assertProposalTransition(proposal.status, 'REJECTED', 'reject');

  const updated = await prisma.proposal.update({
    where: { id: proposalId },
    data: { status: 'REJECTED' },
    include: proposalInclude,
  });

  await notificationProvider.notify({
    event: 'PROPOSAL_REJECTED',
    recipientUserId: proposal.providerUserId,
    title: 'Proposal not selected',
    body: `Your proposal on "${proposal.gig!.title}" was not selected.`,
    metadata: { gigId: proposal.gigId, proposalId },
  });

  return toPublicProposal(updated);
}

export async function withdrawProposal(user: User, proposalId: string) {
  const proposal = await getProposalOrThrow(proposalId);

  if (user.id !== proposal.providerUserId && !user.roles.includes('ADMIN')) {
    throw new UnauthorizedError();
  }

  assertProposalTransition(proposal.status, 'WITHDRAWN', 'withdraw');

  const updated = await prisma.proposal.update({
    where: { id: proposalId },
    data: { status: 'WITHDRAWN' },
    include: proposalInclude,
  });

  await notificationProvider.notify({
    event: 'PROPOSAL_WITHDRAWN',
    recipientUserId: proposal.gig!.ownerUserId,
    title: 'Proposal withdrawn',
    body: `${proposal.provider.fullName} withdrew their proposal on "${proposal.gig!.title}".`,
    metadata: { gigId: proposal.gigId, proposalId },
  });

  return toPublicProposal(updated);
}

export async function counterOffer(user: User, proposalId: string, input: CounterOfferInput) {
  const proposal = await getProposalOrThrow(proposalId);
  const isOwner = user.id === proposal.gig!.ownerUserId;
  const isProvider = user.id === proposal.providerUserId;

  if (!isOwner && !isProvider && !user.roles.includes('ADMIN')) {
    throw new UnauthorizedError();
  }

  assertGigOpenForProposals(proposal.gig!.status as GigStatus);

  if (proposal.status !== 'NEGOTIATING') {
    assertProposalTransition(proposal.status, 'NEGOTIATING', 'negotiate');
  }

  const recipientUserId = isOwner ? proposal.providerUserId : proposal.gig!.ownerUserId;

  const updated = await prisma.$transaction(async (tx) => {
    const gigStatus = proposal.gig!.status as GigStatus;
    if (gigStatus === 'RECEIVING_PROPOSALS') {
      await tx.gig.update({
        where: { id: proposal.gigId },
        data: { status: 'NEGOTIATING' },
      });
    }

    await tx.proposalNegotiationEntry.create({
      data: {
        proposalId,
        authorUserId: user.id,
        message: input.message,
        amountMinor: input.amountMinor,
      },
    });

    return tx.proposal.update({
      where: { id: proposalId },
      data: {
        status: 'NEGOTIATING',
        ...(input.amountMinor !== undefined ? { amountMinor: input.amountMinor } : {}),
      },
      include: proposalInclude,
    });
  });

  await notificationProvider.notify({
    event: 'PROPOSAL_COUNTER_OFFER',
    recipientUserId,
    title: 'New counter-offer',
    body: `${user.fullName} sent a counter-offer on "${proposal.gig!.title}".`,
    metadata: { gigId: proposal.gigId, proposalId },
  });

  return toPublicProposal(updated);
}

export async function acceptProposal(user: User, proposalId: string) {
  const proposal = await getProposalOrThrow(proposalId);
  requireOwnership(user, proposal.gig!.ownerUserId);
  assertProposalTransition(proposal.status, 'ACCEPTED', 'accept');

  const gigStatus = proposal.gig!.status as GigStatus;
  if (!OPEN_GIG_STATUSES.includes(gigStatus) && gigStatus !== 'AWARDED') {
    throw new ConflictError('This gig cannot accept proposals right now.');
  }

  const updated = await prisma.$transaction(async (tx) => {
    await tx.proposal.update({
      where: { id: proposalId },
      data: { status: 'ACCEPTED' },
    });

    await tx.proposal.updateMany({
      where: {
        gigId: proposal.gigId,
        id: { not: proposalId },
        status: { in: ACTIVE_PROPOSAL_STATUSES },
      },
      data: { status: 'REJECTED' },
    });

    await tx.gig.update({
      where: { id: proposal.gigId },
      data: {
        status: 'AWARDED',
        awardedProposalId: proposalId,
      },
    });

    return tx.proposal.findUniqueOrThrow({
      where: { id: proposalId },
      include: proposalInclude,
    });
  });

  await notificationProvider.notify({
    event: 'PROPOSAL_ACCEPTED',
    recipientUserId: proposal.providerUserId,
    title: 'Proposal accepted',
    body: `Your proposal on "${proposal.gig!.title}" was accepted. The gig is now awarded to you.`,
    metadata: { gigId: proposal.gigId, proposalId },
  });

  return toPublicProposal(updated);
}

export async function getMyProposalForGig(user: User, gigId: string) {
  const proposal = await prisma.proposal.findUnique({
    where: { gigId_providerUserId: { gigId, providerUserId: user.id } },
    include: proposalInclude,
  });

  return proposal ? toPublicProposal(proposal) : null;
}
