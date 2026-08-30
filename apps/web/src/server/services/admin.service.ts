import 'server-only';
import { prisma, type User } from '@magobo/db';
import type {
  AdminDashboardStats,
  AdminFlaggedMessageSummary,
  AdminGigSummary,
  AdminListAuditLogsInput,
  AdminListGigsInput,
  AdminListReportsInput,
  AdminListUsersInput,
  AdminReportSummary,
  AdminResolveReportInput,
  AdminSuspendGigInput,
  AdminSuspendUserInput,
  AdminUserSummary,
  PaginatedResult,
} from '@magobo/shared';
import { ConflictError, NotFoundError } from '@/server/errors';
import { requireRole } from '@/server/auth/guards';
import { toAuditLogEntry } from '@/server/serializers/admin';
import { writeAuditLog } from '@/server/services/audit.service';

function assertAdmin(user: User): void {
  requireRole(user, 'ADMIN');
}

export async function getAdminDashboard(user: User): Promise<AdminDashboardStats> {
  assertAdmin(user);

  const [
    totalUsers,
    activeUsers,
    suspendedUsers,
    totalGigs,
    openGigs,
    pendingKycCases,
    openReports,
    flaggedMessages,
  ] = await Promise.all([
    prisma.user.count({ where: { deletedAt: null } }),
    prisma.user.count({ where: { deletedAt: null, status: 'ACTIVE' } }),
    prisma.user.count({ where: { deletedAt: null, status: 'SUSPENDED' } }),
    prisma.gig.count({ where: { deletedAt: null } }),
    prisma.gig.count({
      where: {
        deletedAt: null,
        status: { in: ['RECEIVING_PROPOSALS', 'NEGOTIATING', 'AWARDED', 'IN_PROGRESS'] },
      },
    }),
    prisma.kycCase.count({ where: { status: { in: ['PENDING', 'UNDER_REVIEW'] } } }),
    prisma.report.count({ where: { status: { in: ['OPEN', 'UNDER_REVIEW'] } } }),
    prisma.message.count({ where: { moderationStatus: 'FLAGGED' } }),
  ]);

  return {
    totalUsers,
    activeUsers,
    suspendedUsers,
    totalGigs,
    openGigs,
    pendingKycCases,
    openReports,
    flaggedMessages,
  };
}

export async function listAdminUsers(
  user: User,
  input: AdminListUsersInput,
): Promise<PaginatedResult<AdminUserSummary>> {
  assertAdmin(user);

  const page = input.page ?? 1;
  const pageSize = input.pageSize ?? 20;
  const skip = (page - 1) * pageSize;

  const where = {
    deletedAt: null,
    ...(input.status ? { status: input.status } : {}),
    ...(input.q
      ? {
          OR: [
            { fullName: { contains: input.q, mode: 'insensitive' as const } },
            { email: { contains: input.q, mode: 'insensitive' as const } },
          ],
        }
      : {}),
  };

  const [totalItems, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      include: { kycCase: { select: { status: true } } },
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
    }),
  ]);

  return {
    items: users.map((entry) => ({
      id: entry.id,
      fullName: entry.fullName,
      email: entry.email,
      phone: entry.phone,
      roles: entry.roles,
      status: entry.status,
      kycStatus: entry.kycCase?.status ?? null,
      createdAt: entry.createdAt.toISOString(),
    })),
    page,
    pageSize,
    totalItems,
    totalPages: Math.ceil(totalItems / pageSize) || 1,
  };
}

export async function listAdminGigs(
  user: User,
  input: AdminListGigsInput,
): Promise<PaginatedResult<AdminGigSummary>> {
  assertAdmin(user);

  const page = input.page ?? 1;
  const pageSize = input.pageSize ?? 20;
  const skip = (page - 1) * pageSize;

  const where = {
    deletedAt: null,
    ...(input.status ? { status: input.status as never } : {}),
    ...(input.q
      ? {
          OR: [
            { title: { contains: input.q, mode: 'insensitive' as const } },
            { description: { contains: input.q, mode: 'insensitive' as const } },
          ],
        }
      : {}),
  };

  const [totalItems, gigs] = await Promise.all([
    prisma.gig.count({ where }),
    prisma.gig.findMany({
      where,
      include: { owner: { select: { id: true, fullName: true } }, category: { select: { name: true } } },
      orderBy: { updatedAt: 'desc' },
      skip,
      take: pageSize,
    }),
  ]);

  return {
    items: gigs.map((gig) => ({
      id: gig.id,
      title: gig.title,
      status: gig.status,
      ownerName: gig.owner.fullName,
      ownerUserId: gig.owner.id,
      categoryName: gig.category.name,
      createdAt: gig.createdAt.toISOString(),
    })),
    page,
    pageSize,
    totalItems,
    totalPages: Math.ceil(totalItems / pageSize) || 1,
  };
}

export async function listAdminReports(
  user: User,
  input: AdminListReportsInput,
): Promise<PaginatedResult<AdminReportSummary>> {
  assertAdmin(user);

  const page = input.page ?? 1;
  const pageSize = input.pageSize ?? 20;
  const skip = (page - 1) * pageSize;

  const where = {
    ...(input.status ? { status: input.status } : {}),
  };

  const [totalItems, reports] = await Promise.all([
    prisma.report.count({ where }),
    prisma.report.findMany({
      where,
      include: { reporter: { select: { fullName: true } } },
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
    }),
  ]);

  return {
    items: reports.map((report) => ({
      id: report.id,
      targetType: report.targetType,
      targetId: report.targetId,
      reason: report.reason,
      description: report.description,
      status: report.status,
      reporterName: report.reporter.fullName,
      createdAt: report.createdAt.toISOString(),
      resolvedAt: report.resolvedAt?.toISOString() ?? null,
    })),
    page,
    pageSize,
    totalItems,
    totalPages: Math.ceil(totalItems / pageSize) || 1,
  };
}

export async function listFlaggedMessages(user: User): Promise<AdminFlaggedMessageSummary[]> {
  assertAdmin(user);

  const messages = await prisma.message.findMany({
    where: { moderationStatus: 'FLAGGED' },
    include: {
      sender: { select: { fullName: true } },
      conversation: { include: { gig: { select: { title: true } } } },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return messages.map((message) => ({
    id: message.id,
    conversationId: message.conversationId,
    gigTitle: message.conversation.gig.title,
    senderName: message.sender.fullName,
    body: message.body,
    moderationFlags: message.moderationFlags,
    createdAt: message.createdAt.toISOString(),
  }));
}

export async function listAuditLogs(user: User, input: AdminListAuditLogsInput) {
  assertAdmin(user);

  const page = input.page ?? 1;
  const pageSize = input.pageSize ?? 20;
  const skip = (page - 1) * pageSize;

  const [totalItems, logs] = await Promise.all([
    prisma.auditLog.count(),
    prisma.auditLog.findMany({
      include: { actor: { select: { fullName: true } } },
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
    }),
  ]);

  return {
    items: logs.map(toAuditLogEntry),
    page,
    pageSize,
    totalItems,
    totalPages: Math.ceil(totalItems / pageSize) || 1,
  };
}

export async function resolveReport(user: User, reportId: string, input: AdminResolveReportInput) {
  assertAdmin(user);

  const report = await prisma.report.findUnique({ where: { id: reportId } });
  if (!report) throw new NotFoundError('Report');

  if (report.status === 'RESOLVED' || report.status === 'DISMISSED') {
    throw new ConflictError('This report is already closed.');
  }

  const updated = await prisma.report.update({
    where: { id: reportId },
    data: {
      status: input.status,
      resolutionNote: input.resolutionNote,
      resolvedByUserId: user.id,
      resolvedAt: new Date(),
    },
    include: { reporter: { select: { fullName: true } } },
  });

  await writeAuditLog({
    actorUserId: user.id,
    action: input.status === 'RESOLVED' ? 'REPORT_RESOLVED' : 'REPORT_DISMISSED',
    targetType: 'REPORT',
    targetId: reportId,
    metadata: { resolutionNote: input.resolutionNote },
  });

  return updated;
}

export async function suspendUser(user: User, targetUserId: string, input: AdminSuspendUserInput) {
  assertAdmin(user);

  const target = await prisma.user.findFirst({ where: { id: targetUserId, deletedAt: null } });
  if (!target) throw new NotFoundError('User');
  if (target.roles.includes('ADMIN')) {
    throw new ConflictError('Admin accounts cannot be suspended through this action.');
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: targetUserId },
      data: { status: 'SUSPENDED' },
    }),
    prisma.session.updateMany({
      where: { userId: targetUserId, revokedAt: null },
      data: { revokedAt: new Date() },
    }),
  ]);

  await writeAuditLog({
    actorUserId: user.id,
    action: 'USER_SUSPENDED',
    targetType: 'USER',
    targetId: targetUserId,
    metadata: { reason: input.reason },
  });
}

export async function reactivateUser(user: User, targetUserId: string) {
  assertAdmin(user);

  const target = await prisma.user.findFirst({ where: { id: targetUserId, deletedAt: null } });
  if (!target) throw new NotFoundError('User');

  if (target.status !== 'SUSPENDED') {
    throw new ConflictError('Only suspended users can be reactivated.');
  }

  await prisma.user.update({
    where: { id: targetUserId },
    data: { status: 'ACTIVE' },
  });

  await writeAuditLog({
    actorUserId: user.id,
    action: 'USER_REACTIVATED',
    targetType: 'USER',
    targetId: targetUserId,
  });
}

export async function suspendGig(user: User, gigId: string, input: AdminSuspendGigInput) {
  assertAdmin(user);

  const gig = await prisma.gig.findFirst({ where: { id: gigId, deletedAt: null } });
  if (!gig) throw new NotFoundError('Gig');

  if (gig.status === 'SUSPENDED') {
    throw new ConflictError('Gig is already suspended.');
  }

  await prisma.gig.update({
    where: { id: gigId },
    data: { status: 'SUSPENDED' },
  });

  await writeAuditLog({
    actorUserId: user.id,
    action: 'GIG_SUSPENDED',
    targetType: 'GIG',
    targetId: gigId,
    metadata: { reason: input.reason, previousStatus: gig.status },
  });
}

export async function clearMessageFlag(user: User, messageId: string) {
  assertAdmin(user);

  const message = await prisma.message.findUnique({ where: { id: messageId } });
  if (!message) throw new NotFoundError('Message');

  if (message.moderationStatus !== 'FLAGGED') {
    throw new ConflictError('Message is not flagged.');
  }

  await prisma.message.update({
    where: { id: messageId },
    data: { moderationStatus: 'CLEAN', moderationFlags: [] },
  });

  await writeAuditLog({
    actorUserId: user.id,
    action: 'MESSAGE_FLAG_CLEARED',
    targetType: 'MESSAGE',
    targetId: messageId,
  });
}
