import 'server-only';
import { prisma, type AuditTargetType } from '@magobo/db';
import type { Prisma } from '@magobo/db';

export async function writeAuditLog(input: {
  actorUserId?: string;
  action: string;
  targetType: AuditTargetType;
  targetId: string;
  metadata?: Record<string, unknown>;
}) {
  await prisma.auditLog.create({
    data: {
      actorUserId: input.actorUserId,
      action: input.action,
      targetType: input.targetType,
      targetId: input.targetId,
      metadata: input.metadata as Prisma.InputJsonValue | undefined,
    },
  });
}
