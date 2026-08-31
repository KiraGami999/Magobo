'use client';

import { useCallback, useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Search } from 'lucide-react';
import type { PaginatedResult, PublicCategory, PublicGig } from '@magobo/shared';
import { buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { GigCard } from '@/components/magobo/gig-card';
import { LoadingState } from '@/components/magobo/loading-state';
import { ErrorState } from '@/components/magobo/error-state';
import { EmptyState } from '@/components/magobo/empty-state';
import { apiGet } from '@/lib/api-client';
import { useCurrentUser } from '@/lib/use-current-user';
import { cn } from '@/lib/utils';

function GigsBrowsePage() {
  const searchParams = useSearchParams();
  const { user } = useCurrentUser();
  const [gigs, setGigs] = useState<PaginatedResult<PublicGig> | null>(null);
  const [categories, setCategories] = useState<PublicCategory[]>([]);
  const [q, setQ] = useState(searchParams.get('q') ?? '');
  const [categoryId, setCategoryId] = useState(searchParams.get('categoryId') ?? '');
  const [city, setCity] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (categoryId) params.set('categoryId', categoryId);
    if (city) params.set('city', city);

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
    if (categoriesRes.success) setCategories(categoriesRes.data.categories);
    setLoading(false);
  }, [q, categoryId, city]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const parentCategories = categories.filter((c) => !c.parentId);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Browse gigs</h1>
        <p className="text-muted-foreground mt-2 text-sm sm:text-base">
          Find local work from verified posters across Malawi.
        </p>
      </div>

      <form
        className="relative"
        onSubmit={(event) => {
          event.preventDefault();
          void load();
        }}
      >
        <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2" />
        <Input
          className="h-12 rounded-full pl-11"
          placeholder="Search gigs, skills or cities…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </form>

      <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
        <aside className="flex flex-col gap-6">
          <div>
            <p className="mb-3 text-sm font-semibold">Categories</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setCategoryId('')}
                className={cn(
                  'min-h-9 rounded-full border px-3 text-sm',
                  !categoryId ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-muted',
                )}
              >
                All
              </button>
              {parentCategories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategoryId(cat.id)}
                  className={cn(
                    'min-h-9 rounded-full border px-3 text-sm',
                    categoryId === cat.id
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'hover:bg-muted',
                  )}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="city-filter" className="mb-3 block text-sm font-semibold">
              Location
            </label>
            <Input
              id="city-filter"
              placeholder="City, e.g. Lilongwe"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
          </div>

          {user ? (
            <Link href="/gigs/new" className={buttonVariants()}>
              Post a gig
            </Link>
          ) : null}
        </aside>

        <div>
          {loading && <LoadingState />}
          {error && <ErrorState description={error} onRetry={load} />}
          {!loading && !error && gigs?.items.length === 0 && (
            <EmptyState title="No gigs found" description="Try a different search or category." />
          )}
          {!loading && !error && gigs && gigs.items.length > 0 && (
            <div className="grid gap-4 md:grid-cols-2">
              {gigs.items.map((gig) => (
                <GigCard key={gig.id} gig={gig} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function GigsPage() {
  return (
    <Suspense fallback={<LoadingState page maxWidth="6xl" />}>
      <GigsBrowsePage />
    </Suspense>
  );
}
