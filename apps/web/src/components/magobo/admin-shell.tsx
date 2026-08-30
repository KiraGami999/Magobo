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
    return <LoadingState />;
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Admin</h1>
        <p className="text-muted-foreground text-sm">Platform oversight, moderation, and audit.</p>
      </div>

      <nav className="border-border flex flex-wrap gap-2 border-b pb-4">
        {NAV_ITEMS.map((item) => {
          const active =
            'exact' in item && item.exact ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
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
