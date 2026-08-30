'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { apiGet } from '@/lib/api-client';
import { useCurrentUser } from '@/lib/use-current-user';

export function NotificationBell() {
  const { user } = useCurrentUser();
  const [unreadCount, setUnreadCount] = useState(0);

  const load = useCallback(async () => {
    const response = await apiGet<{ count: number }>('/api/notifications/unread-count');
    if (response.success) {
      setUnreadCount(response.data.count);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [user, load]);

  if (!user) return null;

  return (
    <Link href="/notifications" className="relative inline-flex">
      <Button variant="ghost" size="sm">
        Alerts
      </Button>
      {unreadCount > 0 ? (
        <span className="bg-primary text-primary-foreground absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full text-[10px] font-semibold">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      ) : null}
    </Link>
  );
}
