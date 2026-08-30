'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useCurrentUser } from '@/lib/use-current-user';
import { apiPost } from '@/lib/api-client';

export function SiteHeader() {
  const router = useRouter();
  const { user, loading, refetch } = useCurrentUser();

  async function handleLogout() {
    await apiPost('/api/auth/logout', {});
    await refetch();
    router.push('/');
    router.refresh();
  }

  return (
    <header className="border-border flex items-center justify-between border-b px-4 py-4 sm:px-6 lg:px-8">
      <Link href="/" className="text-lg font-semibold tracking-tight">
        Magobo
      </Link>
      <div className="flex items-center gap-2">
        {loading ? null : user ? (
          <>
            <span className="text-muted-foreground hidden text-sm sm:inline">
              Hi, {user.fullName.split(' ')[0]}
            </span>
            <Link href="/gigs">
              <Button variant="ghost" size="sm">
                Gigs
              </Button>
            </Link>
            <Link href="/messages">
              <Button variant="ghost" size="sm">
                Messages
              </Button>
            </Link>
            <Link href="/projects">
              <Button variant="ghost" size="sm">
                Projects
              </Button>
            </Link>
            {user.roles.includes('SERVICE_PROVIDER') && (
              <Link href="/my/proposals">
                <Button variant="ghost" size="sm">
                  Proposals
                </Button>
              </Link>
            )}
            <Link href="/profile">
              <Button variant="ghost" size="sm">
                Profile
              </Button>
            </Link>
            {user.roles.includes('ADMIN') && (
              <Link href="/admin/kyc">
                <Button variant="ghost" size="sm">
                  Admin
                </Button>
              </Link>
            )}
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              Log out
            </Button>
          </>
        ) : (
          <>
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Log in
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm">Get started</Button>
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
