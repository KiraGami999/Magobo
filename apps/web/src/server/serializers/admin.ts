import type { AuditLog } from '@magobo/db';
import type { AuditLogEntry } from '@magobo/shared';

type AuditWithActor = AuditLog & {
  actor: { fullName: string } | null;
};

export function toAuditLogEntry(entry: AuditWithActor): AuditLogEntry {
  return {
    id: entry.id,
    action: entry.action,
    targetType: entry.targetType,
    targetId: entry.targetId,
    actorName: entry.actor?.fullName ?? null,
    metadata: (entry.metadata as Record<string, unknown> | null) ?? null,
    createdAt: entry.createdAt.toISOString(),
  };
}
