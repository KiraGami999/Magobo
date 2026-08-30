import 'server-only';
import { prisma, type User } from '@magobo/db';
import type { ListNotificationsInput, NotificationPayload, PaginatedResult } from '@magobo/shared';
import { NotFoundError, UnauthorizedError } from '@/server/errors';
import { emailProvider } from '@/server/providers/email';
import { smsProvider } from '@/server/providers/sms';
import { toNotificationSummary } from '@/server/serializers/notification';
import type { Prisma } from '@magobo/db';

export async function dispatchNotification(payload: NotificationPayload): Promise<void> {
  await prisma.notification.create({
    data: {
      userId: payload.recipientUserId,
      event: payload.event,
      title: payload.title,
      body: payload.body,
      metadata: payload.metadata as Prisma.InputJsonValue | undefined,
    },
  });

  const recipient = await prisma.user.findFirst({
    where: { id: payload.recipientUserId, deletedAt: null },
    select: { email: true, phone: true },
  });

  if (!recipient) return;

  if (recipient.email) {
    await emailProvider.send({
      to: recipient.email,
      subject: payload.title,
      body: `${payload.body}\n\n— Magobo`,
    });
  }

  if (recipient.phone) {
    await smsProvider.send({
      to: recipient.phone,
      body: `${payload.title}: ${payload.body}`,
    });
  }
}

export async function listNotifications(
  user: User,
  input: ListNotificationsInput,
): Promise<PaginatedResult<ReturnType<typeof toNotificationSummary>>> {
  const page = input.page ?? 1;
  const pageSize = input.pageSize ?? 20;
  const skip = (page - 1) * pageSize;

  const where = {
    userId: user.id,
    ...(input.unreadOnly ? { readAt: null } : {}),
  };

  const [totalItems, notifications] = await Promise.all([
    prisma.notification.count({ where }),
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
    }),
  ]);

  return {
    items: notifications.map(toNotificationSummary),
    page,
    pageSize,
    totalItems,
    totalPages: Math.ceil(totalItems / pageSize) || 1,
  };
}

export async function getUnreadNotificationCount(user: User): Promise<number> {
  return prisma.notification.count({
    where: { userId: user.id, readAt: null },
  });
}

export async function markNotificationRead(user: User, notificationId: string) {
  const notification = await prisma.notification.findUnique({ where: { id: notificationId } });
  if (!notification) throw new NotFoundError('Notification');
  if (notification.userId !== user.id) throw new UnauthorizedError();

  if (notification.readAt) {
    return toNotificationSummary(notification);
  }

  const updated = await prisma.notification.update({
    where: { id: notificationId },
    data: { readAt: new Date() },
  });

  return toNotificationSummary(updated);
}

export async function markAllNotificationsRead(user: User) {
  await prisma.notification.updateMany({
    where: { userId: user.id, readAt: null },
    data: { readAt: new Date() },
  });
}
