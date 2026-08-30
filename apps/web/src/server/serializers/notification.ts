import type { Notification } from '@magobo/db';
import { resolveNotificationHref, type NotificationSummary } from '@magobo/shared';

export function toNotificationSummary(notification: Notification): NotificationSummary {
  const metadata = (notification.metadata as Record<string, string> | null) ?? null;

  return {
    id: notification.id,
    event: notification.event,
    title: notification.title,
    body: notification.body,
    metadata,
    readAt: notification.readAt?.toISOString() ?? null,
    createdAt: notification.createdAt.toISOString(),
    actionHref: resolveNotificationHref(notification.event, metadata),
  };
}
