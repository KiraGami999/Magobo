import 'server-only';
import {
  prisma,
  type GigStatus,
  type MilestoneStatus,
  type User,
} from '@magobo/db';
import type {
  CreateMilestoneInput,
  ListProjectsInput,
  PaginatedResult,
  ProjectGigSummary,
  RequestRevisionInput,
  SubmitDeliverableInput,
} from '@magobo/shared';
import { ConflictError, NotFoundError, UnauthorizedError } from '@/server/errors';
import { requireOwnership } from '@/server/auth/guards';
import { notificationProvider } from '@/server/providers/notification';
import { storageProvider } from '@/server/providers/storage';
import { toPublicProject } from '@/server/serializers/project';

const projectGigInclude = {
  owner: { select: { id: true, fullName: true } },
  awardedProposal: {
    include: { provider: { select: { id: true, fullName: true } } },
  },
  milestones: true,
  deliverables: {
    include: {
      submittedBy: { select: { id: true, fullName: true } },
      attachments: true,
    },
    orderBy: { submissionNumber: 'desc' as const },
  },
  revisionRequests: {
    include: { requestedBy: { select: { id: true, fullName: true } } },
    orderBy: { createdAt: 'desc' as const },
  },
} as const;

const PROJECT_STATUSES: GigStatus[] = [
  'AWARDED',
  'IN_PROGRESS',
  'SUBMITTED',
  'REVISION_REQUESTED',
  'RESUBMITTED',
  'COMPLETED',
];

function assertProjectGigTransition(current: GigStatus, next: GigStatus, action: string): void {
  const allowed: Partial<Record<GigStatus, GigStatus[]>> = {
    AWARDED: ['IN_PROGRESS'],
    IN_PROGRESS: ['SUBMITTED'],
    SUBMITTED: ['REVISION_REQUESTED', 'COMPLETED'],
    REVISION_REQUESTED: ['RESUBMITTED'],
    RESUBMITTED: ['REVISION_REQUESTED', 'COMPLETED'],
  };

  const permitted = allowed[current];
  if (!permitted?.includes(next)) {
    throw new ConflictError(`Cannot ${action} while the gig is ${current.replaceAll('_', ' ').toLowerCase()}.`);
  }
}

function assertMilestoneTransition(
  current: MilestoneStatus,
  next: MilestoneStatus,
  action: string,
): void {
  const allowed: Partial<Record<MilestoneStatus, MilestoneStatus[]>> = {
    PENDING: ['SUBMITTED'],
    REJECTED: ['SUBMITTED'],
    SUBMITTED: ['APPROVED', 'REJECTED'],
  };

  const permitted = allowed[current];
  if (!permitted?.includes(next)) {
    throw new ConflictError(`Cannot ${action} a milestone in ${current} status.`);
  }
}

async function getProjectGigOrThrow(gigId: string) {
  const gig = await prisma.gig.findFirst({
    where: { id: gigId, deletedAt: null },
    include: projectGigInclude,
  });

  if (!gig) throw new NotFoundError('Gig');
  if (!PROJECT_STATUSES.includes(gig.status)) {
    throw new ConflictError('This gig is not in an active project phase.');
  }
  if (!gig.awardedProposalId) {
    throw new ConflictError('This gig has no awarded provider.');
  }

  return gig;
}

function getProviderUserId(gig: Awaited<ReturnType<typeof getProjectGigOrThrow>>): string {
  const providerId = gig.awardedProposal?.provider.id;
  if (!providerId) throw new ConflictError('This gig has no awarded provider.');
  return providerId;
}

function assertProjectParticipant(user: User, gig: Awaited<ReturnType<typeof getProjectGigOrThrow>>): void {
  const providerId = getProviderUserId(gig);
  if (user.id !== gig.ownerUserId && user.id !== providerId && !user.roles.includes('ADMIN')) {
    throw new UnauthorizedError();
  }
}

function assertAwardedProvider(user: User, gig: Awaited<ReturnType<typeof getProjectGigOrThrow>>): void {
  if (user.id !== getProviderUserId(gig) && !user.roles.includes('ADMIN')) {
    throw new UnauthorizedError();
  }
}

export async function getProject(user: User, gigId: string) {
  const gig = await getProjectGigOrThrow(gigId);
  assertProjectParticipant(user, gig);
  return toPublicProject(gig, user.id);
}

export async function listMyProjects(user: User, input: ListProjectsInput) {
  const page = input.page ?? 1;
  const pageSize = input.pageSize ?? 20;
  const skip = (page - 1) * pageSize;

  const where = {
    deletedAt: null,
    status: { in: PROJECT_STATUSES },
    OR: [
      { ownerUserId: user.id },
      { awardedProposal: { providerUserId: user.id } },
    ],
  };

  const [totalItems, gigs] = await Promise.all([
    prisma.gig.count({ where }),
    prisma.gig.findMany({
      where,
      select: {
        id: true,
        title: true,
        status: true,
        ownerUserId: true,
        updatedAt: true,
        awardedProposal: { select: { providerUserId: true } },
      },
      orderBy: { updatedAt: 'desc' },
      skip,
      take: pageSize,
    }),
  ]);

  const items: ProjectGigSummary[] = gigs.map((gig) => ({
    id: gig.id,
    title: gig.title,
    status: gig.status,
    role: gig.ownerUserId === user.id ? 'OWNER' : 'PROVIDER',
    updatedAt: gig.updatedAt.toISOString(),
  }));

  return {
    items,
    page,
    pageSize,
    totalItems,
    totalPages: Math.ceil(totalItems / pageSize) || 1,
  } satisfies PaginatedResult<ProjectGigSummary>;
}

export async function startProject(user: User, gigId: string) {
  const gig = await getProjectGigOrThrow(gigId);
  assertProjectParticipant(user, gig);
  assertProjectGigTransition(gig.status, 'IN_PROGRESS', 'start');

  const updated = await prisma.gig.update({
    where: { id: gigId },
    data: { status: 'IN_PROGRESS', startedAt: new Date() },
    include: projectGigInclude,
  });

  const recipientUserId =
    user.id === updated.ownerUserId ? getProviderUserId(updated) : updated.ownerUserId;

  await notificationProvider.notify({
    event: 'PROJECT_STARTED',
    recipientUserId,
    title: 'Project started',
    body: `Work has started on "${updated.title}".`,
    metadata: { gigId },
  });

  return toPublicProject(updated, user.id);
}

export async function createMilestone(user: User, gigId: string, input: CreateMilestoneInput) {
  const gig = await getProjectGigOrThrow(gigId);
  requireOwnership(user, gig.ownerUserId);

  if (gig.status !== 'AWARDED' && gig.status !== 'IN_PROGRESS') {
    throw new ConflictError('Milestones can only be added before submission.');
  }

  await prisma.gigMilestone.create({
    data: {
      gigId,
      title: input.title,
      description: input.description,
      sortOrder: input.sortOrder,
      amountMinor: input.amountMinor,
      currency: gig.currency,
      dueAt: input.dueAt,
    },
  });

  return getProject(user, gigId);
}

export async function submitMilestone(user: User, milestoneId: string) {
  const milestone = await prisma.gigMilestone.findUnique({
    where: { id: milestoneId },
    include: { gig: { include: projectGigInclude } },
  });

  if (!milestone) throw new NotFoundError('Milestone');
  assertAwardedProvider(user, milestone.gig);
  assertMilestoneTransition(milestone.status, 'SUBMITTED', 'submit');

  await prisma.gigMilestone.update({
    where: { id: milestoneId },
    data: {
      status: 'SUBMITTED',
      submittedAt: new Date(),
      submittedByUserId: user.id,
    },
  });

  await notificationProvider.notify({
    event: 'MILESTONE_SUBMITTED',
    recipientUserId: milestone.gig.ownerUserId,
    title: 'Milestone submitted',
    body: `${user.fullName} submitted milestone "${milestone.title}" on "${milestone.gig.title}".`,
    metadata: { gigId: milestone.gigId, milestoneId },
  });

  return getProject(user, milestone.gigId);
}

export async function approveMilestone(user: User, milestoneId: string) {
  const milestone = await prisma.gigMilestone.findUnique({
    where: { id: milestoneId },
    include: { gig: { include: projectGigInclude } },
  });

  if (!milestone) throw new NotFoundError('Milestone');
  requireOwnership(user, milestone.gig.ownerUserId);
  assertMilestoneTransition(milestone.status, 'APPROVED', 'approve');

  await prisma.gigMilestone.update({
    where: { id: milestoneId },
    data: { status: 'APPROVED', approvedAt: new Date() },
  });

  await notificationProvider.notify({
    event: 'MILESTONE_APPROVED',
    recipientUserId: getProviderUserId(milestone.gig),
    title: 'Milestone approved',
    body: `Your milestone "${milestone.title}" was approved.`,
    metadata: { gigId: milestone.gigId, milestoneId },
  });

  return getProject(user, milestone.gigId);
}

export async function rejectMilestone(user: User, milestoneId: string) {
  const milestone = await prisma.gigMilestone.findUnique({
    where: { id: milestoneId },
    include: { gig: { include: projectGigInclude } },
  });

  if (!milestone) throw new NotFoundError('Milestone');
  requireOwnership(user, milestone.gig.ownerUserId);
  assertMilestoneTransition(milestone.status, 'REJECTED', 'reject');

  await prisma.gigMilestone.update({
    where: { id: milestoneId },
    data: { status: 'REJECTED', approvedAt: null },
  });

  return getProject(user, milestone.gigId);
}

export async function submitDeliverable(
  user: User,
  gigId: string,
  input: SubmitDeliverableInput,
  files: { fileName: string; mimeType: string; data: Buffer }[] = [],
) {
  const gig = await getProjectGigOrThrow(gigId);
  assertAwardedProvider(user, gig);

  const nextStatus: GigStatus =
    gig.status === 'REVISION_REQUESTED' ? 'RESUBMITTED' : 'SUBMITTED';
  assertProjectGigTransition(gig.status, nextStatus, 'submit deliverable');

  const latest = await prisma.gigDeliverable.findFirst({
    where: { gigId },
    orderBy: { submissionNumber: 'desc' },
  });
  const submissionNumber = (latest?.submissionNumber ?? 0) + 1;

  await prisma.$transaction(async (tx) => {
    if (latest && latest.status === 'PENDING_REVIEW') {
      await tx.gigDeliverable.update({
        where: { id: latest.id },
        data: { status: 'SUPERSEDED' },
      });
    }

    const deliverable = await tx.gigDeliverable.create({
      data: {
        gigId,
        submittedByUserId: user.id,
        submissionNumber,
        notes: input.notes,
        status: 'PENDING_REVIEW',
      },
    });

    for (const file of files) {
      const stored = await storageProvider.store({
        namespace: `deliverables/${gigId}/${deliverable.id}`,
        originalFileName: file.fileName,
        mimeType: file.mimeType,
        data: file.data,
      });

      await tx.gigDeliverableAttachment.create({
        data: {
          deliverableId: deliverable.id,
          storageKey: stored.storageKey,
          originalFileName: stored.originalFileName,
          mimeType: stored.mimeType,
          fileSizeBytes: stored.fileSizeBytes,
        },
      });
    }

    await tx.gig.update({
      where: { id: gigId },
      data: { status: nextStatus },
    });
  });

  await notificationProvider.notify({
    event: 'DELIVERABLE_SUBMITTED',
    recipientUserId: gig.ownerUserId,
    title: 'Deliverable submitted',
    body: `${user.fullName} submitted work on "${gig.title}".`,
    metadata: { gigId },
  });

  return getProject(user, gigId);
}

export async function requestRevision(user: User, gigId: string, input: RequestRevisionInput) {
  const gig = await getProjectGigOrThrow(gigId);
  requireOwnership(user, gig.ownerUserId);
  assertProjectGigTransition(gig.status, 'REVISION_REQUESTED', 'request revision');

  const latestDeliverable = gig.deliverables.find((d) => d.status === 'PENDING_REVIEW');
  if (!latestDeliverable) {
    throw new ConflictError('No pending deliverable to revise.');
  }

  await prisma.$transaction(async (tx) => {
    await tx.gigRevisionRequest.create({
      data: {
        gigId,
        deliverableId: latestDeliverable.id,
        requestedByUserId: user.id,
        message: input.message,
      },
    });

    await tx.gig.update({
      where: { id: gigId },
      data: { status: 'REVISION_REQUESTED' },
    });
  });

  await notificationProvider.notify({
    event: 'REVISION_REQUESTED',
    recipientUserId: getProviderUserId(gig),
    title: 'Revision requested',
    body: `Changes were requested on "${gig.title}".`,
    metadata: { gigId },
  });

  return getProject(user, gigId);
}

export async function acceptDeliverable(user: User, gigId: string) {
  const gig = await getProjectGigOrThrow(gigId);
  requireOwnership(user, gig.ownerUserId);
  assertProjectGigTransition(gig.status, 'COMPLETED', 'accept');

  const latestDeliverable = gig.deliverables.find((d) => d.status === 'PENDING_REVIEW');
  if (!latestDeliverable) {
    throw new ConflictError('No pending deliverable to accept.');
  }

  await prisma.$transaction(async (tx) => {
    await tx.gigDeliverable.update({
      where: { id: latestDeliverable.id },
      data: { status: 'ACCEPTED' },
    });

    await tx.gig.update({
      where: { id: gigId },
      data: { status: 'COMPLETED', completedAt: new Date() },
    });
  });

  await notificationProvider.notify({
    event: 'PROJECT_COMPLETED',
    recipientUserId: getProviderUserId(gig),
    title: 'Work accepted',
    body: `Your deliverable on "${gig.title}" was accepted. The project is complete.`,
    metadata: { gigId },
  });

  return getProject(user, gigId);
}

export async function getDeliverableAttachmentFile(
  user: User,
  gigId: string,
  deliverableId: string,
  attachmentId: string,
) {
  const gig = await getProjectGigOrThrow(gigId);
  assertProjectParticipant(user, gig);

  const attachment = await prisma.gigDeliverableAttachment.findFirst({
    where: {
      id: attachmentId,
      deliverableId,
      deliverable: { gigId },
    },
  });

  if (!attachment) throw new NotFoundError('Attachment');
  return attachment;
}
