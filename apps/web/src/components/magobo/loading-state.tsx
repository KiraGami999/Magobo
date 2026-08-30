import { Skeleton } from '@/components/ui/skeleton';
import { PageFrame } from '@/components/magobo/page-frame';
import { cn } from '@/lib/utils';

export interface LoadingStateProps {
  /** Number of skeleton rows/cards to render. */
  rows?: number;
  className?: string;
  /** Wrap in standard page padding — use for full-page early returns. */
  page?: boolean;
  maxWidth?: 'sm' | 'md' | '2xl' | '3xl' | '5xl' | '6xl';
}

/** Generic skeleton placeholder used while a page/section is fetching data. */
export function LoadingState({ rows = 3, className, page, maxWidth = '3xl' }: LoadingStateProps) {
  const content = (
    <div className={cn('space-y-3', className)} role="status" aria-label="Loading">
      {Array.from({ length: rows }).map((_, index) => (
        <Skeleton key={index} className="h-20 w-full rounded-lg" />
      ))}
    </div>
  );

  if (page) {
    return <PageFrame maxWidth={maxWidth}>{content}</PageFrame>;
  }

  return content;
}
