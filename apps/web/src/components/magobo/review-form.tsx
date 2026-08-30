'use client';

import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { createReviewSchema } from '@magobo/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormField } from '@/components/magobo/form-field';
import { apiPost } from '@/lib/api-client';

interface ReviewFormProps {
  gigId: string;
  revieweeName: string;
  onSubmitted: () => void;
}

export function ReviewForm({ gigId, revieweeName, onSubmitted }: ReviewFormProps) {
  const [rating, setRating] = useState('5');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const parsed = createReviewSchema.safeParse({
      rating: parseInt(rating, 10),
      comment: comment || undefined,
    });

    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? 'Invalid input.');
      return;
    }

    setSubmitting(true);
    const response = await apiPost(`/api/gigs/${gigId}/reviews`, parsed.data);
    setSubmitting(false);

    if (!response.success) {
      toast.error(response.error.message);
      return;
    }

    toast.success('Review submitted.');
    onSubmitted();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Leave a review for {revieweeName}</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <FormField id="rating" label="Rating (1–5)">
            <select
              id="rating"
              className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
              value={rating}
              onChange={(event) => setRating(event.target.value)}
            >
              {[5, 4, 3, 2, 1].map((value) => (
                <option key={value} value={value}>
                  {value} star{value === 1 ? '' : 's'}
                </option>
              ))}
            </select>
          </FormField>
          <FormField id="comment" label="Comment (optional)">
            <textarea
              id="comment"
              className="border-input bg-background min-h-[80px] w-full rounded-md border px-3 py-2 text-sm"
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              placeholder="Share your experience working together…"
            />
          </FormField>
          <Button type="submit" disabled={submitting}>
            Submit review
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
