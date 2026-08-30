import { cn } from '@/lib/utils';

const MAX_WIDTH = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
  '5xl': 'max-w-5xl',
  '6xl': 'max-w-6xl',
} as const;

export interface PageFrameProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: keyof typeof MAX_WIDTH;
}

/** Consistent page padding and max-width for content areas. */
export function PageFrame({ children, className, maxWidth = '3xl' }: PageFrameProps) {
  return (
    <div
      className={cn(
        'mx-auto flex w-full flex-col gap-6 px-4 py-8 sm:px-6',
        MAX_WIDTH[maxWidth],
        className,
      )}
    >
      {children}
    </div>
  );
}
