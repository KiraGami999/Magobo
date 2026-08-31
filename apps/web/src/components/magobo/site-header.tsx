'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { BrandLogo } from '@/components/magobo/brand-logo';
import { NotificationBell } from '@/components/magobo/notification-bell';
import { useCurrentUser } from '@/lib/use-current-user';
import { apiPost } from '@/lib/api-client';
import { cn } from '@/lib/utils';

const PUBLIC_LINKS = [
  { href: '/gigs', label: 'Browse gigs' },
  { href: '/#categories', label: 'Categories' },
  { href: '/#how-it-works', label: 'How it works' },
  { href: '/#trust', label: 'Trust & safety' },
] as const;

type AppLink = { href: string; label: string };

function buildAppLinks(user: NonNullable<ReturnType<typeof useCurrentUser>['user']>): AppLink[] {
  const links: AppLink[] = [
    { href: '/messages', label: 'Messages' },
    { href: '/projects', label: 'Projects' },
  ];
  if (user.roles.includes('SERVICE_PROVIDER')) {
    links.push({ href: '/my/proposals', label: 'Proposals' });
  }
  links.push({ href: '/profile', label: 'Profile' });
  if (user.roles.includes('ADMIN')) {
    links.push({ href: '/admin', label: 'Admin' });
  }
  return links;
}

function navLinkClass(active: boolean) {
  return cn(
    'inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-medium transition-colors',
    active ? 'text-foreground bg-muted' : 'text-foreground/80 hover:bg-muted hover:text-foreground',
  );
}

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, refetch } = useCurrentUser();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMobileOpen(false);
  }, [pathname]);

  async function handleLogout() {
    setMobileOpen(false);
    await apiPost('/api/auth/logout', {});
    await refetch();
    router.push('/');
    router.refresh();
  }

  const appLinks = user ? buildAppLinks(user) : [];

  return (
    <header className="border-border bg-background/95 sticky top-0 z-40 border-b backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <BrandLogo />

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
          {PUBLIC_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={navLinkClass(pathname === link.href || (link.href === '/gigs' && pathname.startsWith('/gigs')))}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {loading ? (
          <div className="h-11 w-28" />
        ) : (
          <div className="flex items-center gap-1 sm:gap-2">
            {user ? (
              <>
                <nav className="hidden items-center gap-1 md:flex" aria-label="Account">
                  {appLinks.map((link) => (
                    <Link key={link.href} href={link.href} className={navLinkClass(pathname.startsWith(link.href))}>
                      {link.label}
                    </Link>
                  ))}
                  <NotificationBell />
                  <Button variant="ghost" size="sm" onClick={handleLogout}>
                    Log out
                  </Button>
                </nav>
                <div className="flex items-center gap-1 md:hidden">
                  <NotificationBell />
                </div>
              </>
            ) : (
              <Link href="/login" className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'hidden sm:inline-flex')}>
                Log in
              </Link>
            )}

            <Link href={user ? '/gigs/new' : '/register'} className={cn(buttonVariants({ size: 'sm' }), 'hidden sm:inline-flex')}>
              Post a gig
            </Link>

            <Button
              variant="outline"
              size="icon"
              className="lg:hidden"
              aria-expanded={mobileOpen}
              aria-controls="mobile-nav"
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              onClick={() => setMobileOpen((open) => !open)}
            >
              {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </Button>
          </div>
        )}
      </div>

      {mobileOpen ? (
        <nav
          id="mobile-nav"
          className="border-border mx-auto flex w-full max-w-6xl flex-col gap-1 border-t px-4 py-3 sm:px-6 lg:hidden"
          aria-label="Mobile"
        >
          {PUBLIC_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className={navLinkClass(false)} onClick={() => setMobileOpen(false)}>
              {link.label}
            </Link>
          ))}
          {user
            ? appLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={navLinkClass(pathname.startsWith(link.href))}
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </Link>
              ))
            : (
                <Link href="/login" className={navLinkClass(false)} onClick={() => setMobileOpen(false)}>
                  Log in
                </Link>
              )}
          <Link
            href={user ? '/gigs/new' : '/register'}
            className={cn(buttonVariants(), 'mt-2 w-full')}
            onClick={() => setMobileOpen(false)}
          >
            Post a gig
          </Link>
          {user ? (
            <Button variant="ghost" className="w-full justify-start" onClick={handleLogout}>
              Log out
            </Button>
          ) : null}
        </nav>
      ) : null}
    </header>
  );
}
