import 'server-only';
import type { NotificationPayload, NotificationProvider } from '@magobo/shared';
import { dispatchNotification } from '@/server/services/notification.service';

/**
 * Persists in-app notifications and fans out to mock email/SMS providers.
 * Call sites across domain services keep using `notificationProvider.notify()`.
 */
class MagoboNotificationProvider implements NotificationProvider {
  async notify(payload: NotificationPayload): Promise<void> {
    await dispatchNotification(payload);
  }
}

export type { NotificationPayload, NotificationProvider };

export const notificationProvider: NotificationProvider = new MagoboNotificationProvider();
