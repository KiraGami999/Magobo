'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import type { PaginatedResult, PublicCategory, PublicGig } from '@magobo/shared';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { GigCard } from '@/components/magobo/gig-card';
import { LoadingState } from '@/components/magobo/loading-state';
import { ErrorState } from '@/components/magobo/error-state';
import { EmptyState } from '@/components/magobo/empty-state';
import { apiGet } from '@/lib/api-client';
import { useCurrentUser } from '@/lib/use-current-user';

export default function GigsBrowsePage() {
  const { user } = useCurrentUser();
  const [gigs, setGigs] = useState<PaginatedResult<PublicGig> | null>(null);
  const [categories, setCategories] = useState<PublicCategory[]>([]);
  const [q, setQ] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (categoryId) params.set('categoryId', categoryId);

    const [gigsRes, categoriesRes] = await Promise.all([
      apiGet<PaginatedResult<PublicGig>>(`/api/gigs?${params.toString()}`),
      apiGet<{ categories: PublicCategory[] }>('/api/categories'),
    ]);

    if (!gigsRes.success) {
      setError(gigsRes.error.message);
      setLoading(false);
      return;
    }

    setGigs(gigsRes.data);
    if (categoriesRes.success) setCategories(categoriesRes.data.categories.flatMap((c) => c.children ?? []));
    setLoading(false);
  }, [q, categoryId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Browse gigs</h1>
          <p className="text-muted-foreground text-sm">Find local work opportunities on Magobo.</p>
        </div>
        {user && (
          <Link href="/gigs/new" className={buttonVariants({ size: 'sm' })}>
            Post a gig
          </Link>
        )}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Input placeholder="Search gigs…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select
          className="border-input bg-background h-9 rounded-lg border px-3 text-sm"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
        >
          <option value="">All categories</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
        <Button variant="outline" onClick={load}>
          Search
        </Button>
      </div>

      {loading && <LoadingState />}
      {error && <ErrorState description={error} onRetry={load} />}
      {!loading && !error && gigs?.items.length === 0 && (
        <EmptyState title="No gigs found" description="Try different filters or check back soon." />
      )}
      {!loading && !error && gigs && gigs.items.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {gigs.items.map((gig) => (
            <GigCard key={gig.id} gig={gig} />
          ))}
        </div>
      )}
    </div>
  );
}
