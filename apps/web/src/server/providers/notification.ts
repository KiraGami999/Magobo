import 'server-only';

export type NotificationEvent =
  | 'PROPOSAL_SUBMITTED'
  | 'PROPOSAL_SHORTLISTED'
  | 'PROPOSAL_REJECTED'
  | 'PROPOSAL_ACCEPTED'
  | 'PROPOSAL_WITHDRAWN'
  | 'PROPOSAL_COUNTER_OFFER'
  | 'MESSAGE_RECEIVED'
  | 'PROJECT_STARTED'
  | 'MILESTONE_SUBMITTED'
  | 'MILESTONE_APPROVED'
  | 'DELIVERABLE_SUBMITTED'
  | 'REVISION_REQUESTED'
  | 'PROJECT_COMPLETED'
  | 'REVIEW_RECEIVED';

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

/**
 * Development/mock implementation — logs instead of persisting or pushing.
 * Phase 11 will replace this with a real notification service (in-app, email,
 * push) without changing callers.
 */
class ConsoleNotificationProvider implements NotificationProvider {
  async notify(payload: NotificationPayload): Promise<void> {
    console.log('[mock_notification_provider]', payload);
  }
}

export const notificationProvider: NotificationProvider = new ConsoleNotificationProvider();
