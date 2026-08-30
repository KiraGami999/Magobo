'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { PaginatedResult, ProjectGigSummary } from '@magobo/shared';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/magobo/status-badge';
import { LoadingState } from '@/components/magobo/loading-state';
import { ErrorState } from '@/components/magobo/error-state';
import { EmptyState } from '@/components/magobo/empty-state';
import { apiGet } from '@/lib/api-client';
import { useCurrentUser } from '@/lib/use-current-user';

export default function ProjectsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useCurrentUser();
  const [projects, setProjects] = useState<PaginatedResult<ProjectGigSummary> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const response = await apiGet<PaginatedResult<ProjectGigSummary>>('/api/projects/mine');
    if (!response.success) {
      setError(response.error.message);
      setLoading(false);
      return;
    }
    setProjects(response.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login');
  }, [authLoading, user, router]);

  useEffect(() => {
    if (user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      void load();
    }
  }, [user, load]);

  if (authLoading || loading) return <LoadingState page />;
  if (error) return <ErrorState page description={error} onRetry={load} />;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
          <p className="text-muted-foreground text-sm">Active and completed work you own or were awarded.</p>
        </div>
        <Link href="/gigs" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
          Browse gigs
        </Link>
      </div>

      {projects?.items.length === 0 ? (
        <EmptyState
          title="No projects yet"
          description="Projects appear here after a proposal is accepted."
        />
      ) : (
        <div className="space-y-3">
          {projects?.items.map((project) => (
            <Link key={project.id} href={`/projects/${project.id}`}>
              <Card className="transition-colors hover:bg-muted/40">
                <CardHeader className="pb-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <CardTitle className="text-base">{project.title}</CardTitle>
                    <StatusBadge tone="info" label={project.status.replaceAll('_', ' ')} />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm">
                    {project.role === 'OWNER' ? 'You posted this gig' : 'You were awarded this gig'}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
