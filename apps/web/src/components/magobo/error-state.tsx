import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageFrame } from '@/components/magobo/page-frame';
import { cn } from '@/lib/utils';

export interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
  /** Wrap in standard page padding — use for full-page early returns. */
  page?: boolean;
  maxWidth?: 'sm' | 'md' | '2xl' | '3xl' | '5xl' | '6xl';
}

/**
 * Standard "something went wrong" surface. Never show a raw error message
 * or stack trace here — pass a friendly `description` instead.
 */
export function ErrorState({
  title = 'Something went wrong',
  description = 'Please try again. If the problem continues, come back in a few minutes.',
  onRetry,
  className,
  page,
  maxWidth = '3xl',
}: ErrorStateProps) {
  const content = (
    <div
      className={cn(
        'border-border flex flex-col items-center justify-center gap-3 rounded-lg border px-6 py-12 text-center',
        className,
      )}
    >
      <AlertTriangle className="text-destructive size-8" aria-hidden="true" />
      <div className="space-y-1">
        <p className="text-foreground text-sm font-medium">{title}</p>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>
      {onRetry ? (
        <Button variant="outline" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  );

  if (page) {
    return <PageFrame maxWidth={maxWidth}>{content}</PageFrame>;
  }

  return content;
}
