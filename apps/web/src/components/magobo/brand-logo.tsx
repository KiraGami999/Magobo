import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

export function BrandLogo({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <Link href="/" className={cn('flex items-center gap-2', className)}>
      <span
        className="bg-primary text-primary-foreground flex size-8 shrink-0 items-center justify-center rounded-full"
        aria-hidden="true"
      >
        <ShieldCheck className="size-4" strokeWidth={2.4} />
      </span>
      {compact ? <span className="sr-only">Magobo</span> : <span className="text-lg font-semibold tracking-tight">Magobo</span>}
    </Link>
  );
}
