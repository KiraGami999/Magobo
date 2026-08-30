import { BadgeCheck, Clock, ShieldAlert, ShieldQuestion } from 'lucide-react';
import { cn } from '@/lib/utils';

export type VerificationState = 'verified' | 'pending' | 'rejected' | 'unverified';

const CONFIG: Record<
  VerificationState,
  { label: string; icon: typeof BadgeCheck; className: string }
> = {
  verified: {
    label: 'Verified',
    icon: BadgeCheck,
    className: 'text-success',
  },
  pending: {
    label: 'Verification pending',
    icon: Clock,
    className: 'text-warning-foreground',
  },
  rejected: {
    label: 'Verification rejected',
    icon: ShieldAlert,
    className: 'text-destructive',
  },
  unverified: {
    label: 'Not verified',
    icon: ShieldQuestion,
    className: 'text-muted-foreground',
  },
};

export interface VerificationBadgeProps {
  state: VerificationState;
  className?: string;
  /** Render the label text next to the icon. Defaults to icon-only. */
  showLabel?: boolean;
}

/**
 * Small trust signal shown on profile cards, gig cards, and proposal
 * screens so users can immediately see whether they're dealing with a
 * verified identity — a core Magobo trust requirement.
 */
export function VerificationBadge({ state, className, showLabel = false }: VerificationBadgeProps) {
  const { label, icon: Icon, className: toneClassName } = CONFIG[state];

  return (
    <span
      className={cn('inline-flex items-center gap-1 text-xs font-medium', toneClassName, className)}
      title={label}
    >
      <Icon className="size-3.5" aria-hidden="true" />
      {showLabel && <span>{label}</span>}
      <span className="sr-only">{label}</span>
    </span>
  );
}
