import type {
  Gig,
  GigDeliverable,
  GigDeliverableAttachment,
  GigMilestone,
  GigRevisionRequest,
  User,
} from '@magobo/db';
import type {
  DeliverableSummary,
  MilestoneSummary,
  PublicProject,
  RevisionRequestSummary,
} from '@magobo/shared';

type ProjectGig = Gig & {
  owner: Pick<User, 'id' | 'fullName'>;
  awardedProposal?: {
    provider: Pick<User, 'id' | 'fullName'>;
  } | null;
  milestones: GigMilestone[];
  deliverables: (GigDeliverable & {
    submittedBy: Pick<User, 'id' | 'fullName'>;
    attachments: GigDeliverableAttachment[];
  })[];
  revisionRequests: (GigRevisionRequest & {
    requestedBy: Pick<User, 'id' | 'fullName'>;
  })[];
};

export function toMilestoneSummary(milestone: GigMilestone): MilestoneSummary {
  return {
    id: milestone.id,
    title: milestone.title,
    description: milestone.description,
    sortOrder: milestone.sortOrder,
    amountMinor: milestone.amountMinor,
    currency: milestone.currency,
    status: milestone.status,
    dueAt: milestone.dueAt?.toISOString() ?? null,
    submittedAt: milestone.submittedAt?.toISOString() ?? null,
    approvedAt: milestone.approvedAt?.toISOString() ?? null,
  };
}

export function toDeliverableSummary(
  deliverable: GigDeliverable & {
    submittedBy: Pick<User, 'id' | 'fullName'>;
    attachments: GigDeliverableAttachment[];
  },
  gigId: string,
): DeliverableSummary {
  return {
    id: deliverable.id,
    submissionNumber: deliverable.submissionNumber,
    notes: deliverable.notes,
    status: deliverable.status,
    submittedByUserId: deliverable.submittedByUserId,
    submittedByName: deliverable.submittedBy.fullName,
    attachments: deliverable.attachments.map((attachment) => ({
      id: attachment.id,
      originalFileName: attachment.originalFileName,
      mimeType: attachment.mimeType,
      fileSizeBytes: attachment.fileSizeBytes,
      uploadedAt: attachment.uploadedAt.toISOString(),
      downloadUrl: `/api/gigs/${gigId}/deliverables/${deliverable.id}/attachments/${attachment.id}`,
    })),
    createdAt: deliverable.createdAt.toISOString(),
  };
}

export function toRevisionRequestSummary(
  revision: GigRevisionRequest & { requestedBy: Pick<User, 'id' | 'fullName'> },
): RevisionRequestSummary {
  return {
    id: revision.id,
    deliverableId: revision.deliverableId,
    message: revision.message,
    requestedByName: revision.requestedBy.fullName,
    createdAt: revision.createdAt.toISOString(),
  };
}

export function toPublicProject(
  gig: ProjectGig,
  viewerId: string,
): PublicProject {
  const provider = gig.awardedProposal?.provider ?? null;
  const isOwner = viewerId === gig.ownerUserId;

  return {
    gigId: gig.id,
    gigTitle: gig.title,
    gigStatus: gig.status,
    currency: gig.currency,
    startedAt: gig.startedAt?.toISOString() ?? null,
    completedAt: gig.completedAt?.toISOString() ?? null,
    owner: { userId: gig.owner.id, fullName: gig.owner.fullName, role: 'OWNER' },
    provider: provider
      ? { userId: provider.id, fullName: provider.fullName, role: 'PROVIDER' }
      : null,
    milestones: gig.milestones
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map(toMilestoneSummary),
    deliverables: gig.deliverables
      .slice()
      .sort((a, b) => b.submissionNumber - a.submissionNumber)
      .map((deliverable) => toDeliverableSummary(deliverable, gig.id)),
    revisionRequests: gig.revisionRequests
      .slice()
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .map(toRevisionRequestSummary),
    canStart: gig.status === 'AWARDED' && (isOwner || viewerId === provider?.id),
    canSubmitDeliverable:
      (gig.status === 'IN_PROGRESS' || gig.status === 'REVISION_REQUESTED') &&
      viewerId === provider?.id,
    canRequestRevision:
      (gig.status === 'SUBMITTED' || gig.status === 'RESUBMITTED') && isOwner,
    canAcceptDeliverable:
      (gig.status === 'SUBMITTED' || gig.status === 'RESUBMITTED') && isOwner,
    canManageMilestones:
      (gig.status === 'AWARDED' || gig.status === 'IN_PROGRESS') && isOwner,
  };
}
