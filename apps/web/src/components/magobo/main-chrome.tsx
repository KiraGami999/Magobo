'use client';

import { usePathname } from 'next/navigation';
import { SiteHeader } from '@/components/magobo/site-header';

const AUTH_PREFIXES = ['/login', '/register', '/forgot-password', '/reset-password'];

function shouldShowSiteHeader(pathname: string): boolean {
  if (pathname.startsWith('/admin')) return false;
  return !AUTH_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function MainChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const showHeader = shouldShowSiteHeader(pathname);

  return (
    <div className="flex min-h-full flex-1 flex-col overflow-x-hidden">
      {showHeader ? <SiteHeader /> : null}
      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  );
}
