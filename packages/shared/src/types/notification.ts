export const NOTIFICATION_EVENTS = [
  'PROPOSAL_SUBMITTED',
  'PROPOSAL_SHORTLISTED',
  'PROPOSAL_REJECTED',
  'PROPOSAL_ACCEPTED',
  'PROPOSAL_WITHDRAWN',
  'PROPOSAL_COUNTER_OFFER',
  'MESSAGE_RECEIVED',
  'PROJECT_STARTED',
  'MILESTONE_SUBMITTED',
  'MILESTONE_APPROVED',
  'DELIVERABLE_SUBMITTED',
  'REVISION_REQUESTED',
  'PROJECT_COMPLETED',
  'REVIEW_RECEIVED',
] as const;

export type NotificationEvent = (typeof NOTIFICATION_EVENTS)[number];

export interface NotificationPayload {
  event: NotificationEvent;
  recipientUserId: string;
  title: string;
  body: string;
  metadata?: Record<string, string>;
}

export interface NotificationProvider {
  notify(payload: NotificationPayload): Promise<void>;
}

export interface NotificationSummary {
  id: string;
  event: NotificationEvent;
  title: string;
  body: string;
  metadata: Record<string, string> | null;
  readAt: string | null;
  createdAt: string;
  actionHref: string | null;
}

/**
 * Maps a notification to a deep link within the web app. Mobile can reuse
 * the same metadata keys with its own router.
 */
export function resolveNotificationHref(
  event: NotificationEvent,
  metadata?: Record<string, string> | null,
): string | null {
  if (!metadata) return null;

  if (event === 'MESSAGE_RECEIVED' && metadata.conversationId) {
    return `/messages/${metadata.conversationId}`;
  }

  if (metadata.proposalId && event.startsWith('PROPOSAL_')) {
    return `/proposals/${metadata.proposalId}`;
  }

  if (metadata.gigId) {
    if (
      event.startsWith('PROJECT_') ||
      event.startsWith('MILESTONE_') ||
      event === 'DELIVERABLE_SUBMITTED' ||
      event === 'REVISION_REQUESTED' ||
      event === 'REVIEW_RECEIVED'
    ) {
      return `/projects/${metadata.gigId}`;
    }

    if (event.startsWith('PROPOSAL_')) {
      return `/gigs/${metadata.gigId}`;
    }
  }

  return null;
}
