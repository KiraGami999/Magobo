import Link from 'next/link';
import { MapPin } from 'lucide-react';
import type { PublicGig } from '@magobo/shared';
import { PROJECT_GIG_STATUSES } from '@magobo/shared';
import { VerificationBadge } from '@/components/magobo/verification-badge';
import { formatGigBudget } from '@/lib/format-money';
import { cn } from '@/lib/utils';

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export function GigCard({ gig }: { gig: PublicGig }) {
  const location = [gig.location.city, gig.location.country].filter(Boolean).join(', ') || 'Remote';
  const isProject = PROJECT_GIG_STATUSES.includes(gig.status as (typeof PROJECT_GIG_STATUSES)[number]);
  const href = isProject ? `/projects/${gig.id}` : `/gigs/${gig.id}`;
  const budget = formatGigBudget(gig.budget.minMinor, gig.budget.maxMinor, gig.budget.currency);
  const open = gig.status === 'RECEIVING_PROPOSALS';

  return (
    <Link
      href={href}
      className="bg-card hover:border-primary/25 flex h-full flex-col rounded-2xl border p-5 transition-colors"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="bg-accent text-primary flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
            {initials(gig.owner.fullName)}
          </span>
          <p className="flex min-w-0 items-center gap-1 truncate text-sm font-medium">
            {gig.owner.fullName}
            {gig.owner.kycVerified ? <VerificationBadge state="verified" /> : null}
          </p>
        </div>
      </div>

      <h3 className="mt-4 text-base leading-snug font-semibold">{gig.title}</h3>
      <p className="text-muted-foreground mt-2 line-clamp-2 flex-1 text-sm">{gig.description}</p>

      <div className="text-muted-foreground mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
        <span className="bg-muted rounded-full px-2.5 py-0.5">{gig.category.name}</span>
        <span className="inline-flex items-center gap-1">
          <MapPin className="size-3.5" aria-hidden="true" />
          {location}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap items-end justify-between gap-2">
        <p className="text-sm font-semibold">
          {budget === '—' ? 'Budget on request' : `From ${budget}`}
        </p>
        <span
          className={cn(
            'rounded-full px-2.5 py-0.5 text-xs font-medium',
            open ? 'bg-accent text-primary' : 'bg-muted text-muted-foreground',
          )}
        >
          {open ? 'Available now' : gig.status.replaceAll('_', ' ')}
        </span>
      </div>
    </Link>
  );
}
