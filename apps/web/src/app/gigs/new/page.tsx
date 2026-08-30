'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { createGigSchema, type PublicCategory } from '@magobo/shared';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormField } from '@/components/magobo/form-field';
import { apiGet, apiPost } from '@/lib/api-client';
import { useCurrentUser } from '@/lib/use-current-user';

export default function NewGigPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useCurrentUser();
  const [categories, setCategories] = useState<PublicCategory[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [budgetMax, setBudgetMax] = useState('');
  const [city, setCity] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login');
  }, [authLoading, user, router]);

  useEffect(() => {
    void apiGet<{ categories: PublicCategory[] }>('/api/categories').then((res) => {
      if (res.success) setCategories(res.data.categories.flatMap((c) => c.children ?? []));
    });
  }, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const budgetMaxMinor = Math.round(parseFloat(budgetMax || '0') * 100);

    const parsed = createGigSchema.safeParse({
      title,
      description,
      categoryId,
      budgetMaxMinor: budgetMaxMinor || undefined,
      location: city ? { city } : undefined,
    });

    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? 'Invalid input.');
      return;
    }

    setSubmitting(true);
    const response = await apiPost<{ gig: { id: string } }>('/api/gigs', parsed.data);
    setSubmitting(false);

    if (!response.success) {
      toast.error(response.error.message);
      return;
    }

    toast.success('Draft created.');
    router.push(`/gigs/${response.data.gig.id}/edit`);
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Post a gig</h1>
        <Link href="/gigs" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
          Cancel
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Gig details</CardTitle>
        </CardHeader>
        <CardContent>
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
            <FormField id="category" label="Category">
              <select
                id="category"
                className="border-input bg-background h-9 w-full rounded-lg border px-3 text-sm"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
              >
                <option value="">Select a category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField id="budget" label="Budget (MWK)">
              <Input id="budget" type="number" min="0" value={budgetMax} onChange={(e) => setBudgetMax(e.target.value)} />
            </FormField>
            <FormField id="city" label="City">
              <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} />
            </FormField>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? 'Saving draft…' : 'Save as draft'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
