'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useCurrentUser } from '@/lib/use-current-user';
import { LoadingState } from '@/components/magobo/loading-state';

const NAV_ITEMS = [
  { href: '/admin', label: 'Dashboard', exact: true },
  { href: '/admin/users', label: 'Users' },
  { href: '/admin/gigs', label: 'Gigs' },
  { href: '/admin/kyc', label: 'KYC' },
  { href: '/admin/reports', label: 'Reports' },
  { href: '/admin/moderation', label: 'Moderation' },
  { href: '/admin/audit', label: 'Audit log' },
] as const;

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useCurrentUser();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
      return;
    }
    if (user && !user.roles.includes('ADMIN')) {
      router.replace('/');
    }
  }, [loading, user, router]);

  if (loading || !user || !user.roles.includes('ADMIN')) {
    return <LoadingState page maxWidth="6xl" />;
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Admin</h1>
        <p className="text-muted-foreground text-sm">Platform oversight, moderation, and audit.</p>
      </div>

      <nav
        className="border-border -mx-4 flex gap-2 overflow-x-auto border-b px-4 pb-4 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0"
        aria-label="Admin sections"
      >
        {NAV_ITEMS.map((item) => {
          const active =
            'exact' in item && item.exact ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'inline-flex min-h-11 shrink-0 items-center rounded-md px-4 py-2 text-sm font-medium transition-colors',
                active
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      {children}
    </div>
  );
}
