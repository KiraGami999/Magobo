'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { NotificationBell } from '@/components/magobo/notification-bell';
import { useCurrentUser } from '@/lib/use-current-user';
import { apiPost } from '@/lib/api-client';
import { cn } from '@/lib/utils';

type NavLink = { href: string; label: string };

function buildNavLinks(user: NonNullable<ReturnType<typeof useCurrentUser>['user']>): NavLink[] {
  const links: NavLink[] = [
    { href: '/gigs', label: 'Gigs' },
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

  const navLinks = user ? buildNavLinks(user) : [];

  return (
    <header className="border-border bg-background sticky top-0 z-40 border-b">
      <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          Magobo
        </Link>

        {loading ? null : user ? (
          <>
            <span className="text-muted-foreground hidden min-w-0 truncate text-sm lg:inline">
              Hi, {user.fullName.split(' ')[0]}
            </span>

            <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
              {navLinks.map((link) => (
                <Link key={link.href} href={link.href}>
                  <Button variant="ghost" size="sm">
                    {link.label}
                  </Button>
                </Link>
              ))}
              <NotificationBell />
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                Log out
              </Button>
            </nav>

            <div className="flex items-center gap-1 md:hidden">
              <NotificationBell />
              <Button
                variant="outline"
                size="icon"
                aria-expanded={mobileOpen}
                aria-controls="mobile-nav"
                aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
                onClick={() => setMobileOpen((open) => !open)}
              >
                {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
              </Button>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-2">
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Log in
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm">Get started</Button>
            </Link>
          </div>
        )}
      </div>

      {user && mobileOpen ? (
        <nav
          id="mobile-nav"
          className="border-border flex flex-col gap-1 border-t px-4 py-3 md:hidden"
          aria-label="Main"
        >
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                buttonVariants({ variant: 'ghost', size: 'default' }),
                'w-full justify-start',
                pathname === link.href || pathname.startsWith(`${link.href}/`)
                  ? 'bg-muted'
                  : undefined,
              )}
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <Button variant="ghost" className="w-full justify-start" onClick={handleLogout}>
            Log out
          </Button>
        </nav>
      ) : null}
    </header>
  );
}
