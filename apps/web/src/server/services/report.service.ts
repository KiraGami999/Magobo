import 'server-only';
import { prisma, type User } from '@magobo/db';
import type { CreateReportInput } from '@magobo/shared';
import { ConflictError, NotFoundError } from '@/server/errors';

async function assertReportTargetExists(targetType: CreateReportInput['targetType'], targetId: string) {
  if (targetType === 'USER') {
    const target = await prisma.user.findFirst({ where: { id: targetId, deletedAt: null } });
    if (!target) throw new NotFoundError('User');
    return;
  }

  if (targetType === 'GIG') {
    const gig = await prisma.gig.findFirst({ where: { id: targetId, deletedAt: null } });
    if (!gig) throw new NotFoundError('Gig');
    return;
  }

  const message = await prisma.message.findUnique({ where: { id: targetId } });
  if (!message) throw new NotFoundError('Message');
}

export async function createReport(user: User, input: CreateReportInput) {
  if (input.targetType === 'USER' && input.targetId === user.id) {
    throw new ConflictError('You cannot report yourself.');
  }

  await assertReportTargetExists(input.targetType, input.targetId);

  const recentDuplicate = await prisma.report.findFirst({
    where: {
      reporterUserId: user.id,
      targetType: input.targetType,
      targetId: input.targetId,
      status: { in: ['OPEN', 'UNDER_REVIEW'] },
    },
  });

  if (recentDuplicate) {
    throw new ConflictError('You already have an open report for this target.');
  }

  return prisma.report.create({
    data: {
      reporterUserId: user.id,
      targetType: input.targetType,
      targetId: input.targetId,
      reason: input.reason,
      description: input.description,
    },
  });
}
