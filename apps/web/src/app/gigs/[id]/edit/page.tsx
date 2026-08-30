'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { updateGigSchema, type PublicGig } from '@magobo/shared';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { FormField } from '@/components/magobo/form-field';
import { LoadingState } from '@/components/magobo/loading-state';
import { ErrorState } from '@/components/magobo/error-state';
import { apiGet } from '@/lib/api-client';

export default function EditGigPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [budgetMax, setBudgetMax] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    if (!params.id) return;
    setLoading(true);
    const response = await apiGet<{ gig: PublicGig }>(`/api/gigs/${params.id}`);
    if (!response.success) {
      setError(response.error.message);
      setLoading(false);
      return;
    }

    const gig = response.data.gig;
    if (gig.status !== 'DRAFT') {
      router.replace(`/gigs/${gig.id}`);
      return;
    }

    setTitle(gig.title);
    setDescription(gig.description);
    setBudgetMax(gig.budget.maxMinor ? String(gig.budget.maxMinor / 100) : '');
    setLoading(false);
  }, [params.id, router]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!params.id) return;

    const budgetMaxMinor = budgetMax ? Math.round(parseFloat(budgetMax) * 100) : undefined;
    const parsed = updateGigSchema.safeParse({ title, description, budgetMaxMinor });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? 'Invalid input.');
      return;
    }

    setSubmitting(true);
    const response = await fetch(`/api/gigs/${params.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parsed.data),
    });
    const body = (await response.json()) as { success: boolean; error?: { message: string } };
    setSubmitting(false);

    if (!body.success) {
      toast.error(body.error?.message ?? 'Could not save.');
      return;
    }

    toast.success('Draft updated.');
    router.push(`/gigs/${params.id}`);
  }

  if (loading) return <LoadingState page />;
  if (error) return <ErrorState page description={error} onRetry={load} />;

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Edit draft</h1>
        <Link href={`/gigs/${params.id}`} className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
          Cancel
        </Link>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <FormField id="title" label="Title">
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
            </FormField>
            <FormField id="description" label="Description">
              <textarea
                id="description"
                className="border-input bg-background min-h-28 w-full rounded-lg border px-3 py-2 text-sm"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </FormField>
            <FormField id="budget" label="Budget (MWK)">
              <Input id="budget" type="number" min="0" value={budgetMax} onChange={(e) => setBudgetMax(e.target.value)} />
            </FormField>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? 'Saving…' : 'Save changes'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
