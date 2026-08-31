'use client';

import { usePathname } from 'next/navigation';
import { SiteHeader } from '@/components/magobo/site-header';
import { SiteFooter } from '@/components/magobo/site-footer';

const AUTH_PREFIXES = ['/login', '/register', '/forgot-password', '/reset-password'];

function shouldShowChrome(pathname: string): boolean {
  if (pathname.startsWith('/admin')) return false;
  return !AUTH_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function MainChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const showChrome = shouldShowChrome(pathname);

  return (
    <div className="flex min-h-full flex-1 flex-col overflow-x-hidden">
      {showChrome ? <SiteHeader /> : null}
      <main className="flex flex-1 flex-col">{children}</main>
      {showChrome ? <SiteFooter /> : null}
    </div>
  );
}
