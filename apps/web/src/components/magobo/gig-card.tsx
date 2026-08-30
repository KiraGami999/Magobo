import Link from 'next/link';
import type { PublicGig } from '@magobo/shared';
import { PROJECT_GIG_STATUSES } from '@magobo/shared';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/magobo/status-badge';
import { VerificationBadge } from '@/components/magobo/verification-badge';
import { formatGigBudget } from '@/lib/format-money';

export function GigCard({ gig }: { gig: PublicGig }) {
  const location = [gig.location.city, gig.location.country].filter(Boolean).join(', ') || 'Location flexible';
  const isProject = PROJECT_GIG_STATUSES.includes(gig.status as (typeof PROJECT_GIG_STATUSES)[number]);
  const href = isProject ? `/projects/${gig.id}` : `/gigs/${gig.id}`;

  return (
    <Link href={href} className="block">
      <Card className="transition-shadow hover:shadow-md">
        <CardHeader className="gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge tone="info" label={gig.status.replaceAll('_', ' ')} />
            <span className="text-muted-foreground text-xs">{gig.category.name}</span>
          </div>
          <CardTitle className="text-base leading-snug">{gig.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-muted-foreground line-clamp-2 text-sm">{gig.description}</p>
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <span className="font-medium">
              {formatGigBudget(gig.budget.minMinor, gig.budget.maxMinor, gig.budget.currency)}
            </span>
            <span className="text-muted-foreground">{location}</span>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <span className="text-sm">{gig.owner.fullName}</span>
            {gig.owner.kycVerified && <VerificationBadge state="verified" />}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
