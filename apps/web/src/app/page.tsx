import Link from 'next/link';
import {
  ClipboardList,
  Lock,
  MessageCircle,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { GigCard } from '@/components/magobo/gig-card';
import { MARKETING_CATEGORIES } from '@/lib/marketing-categories';
import { discoverGigs } from '@/server/services/gig.service';
import { cn } from '@/lib/utils';

const STEPS = [
  {
    n: '01',
    title: 'Post a gig',
    body: 'Describe the work, budget and location. Publishing is free.',
  },
  {
    n: '02',
    title: 'Get proposals',
    body: 'Verified providers quote, negotiate and message you on Magobo.',
  },
  {
    n: '03',
    title: 'Hire & manage',
    body: 'Award the gig, track milestones and request revisions in one place.',
  },
  {
    n: '04',
    title: 'Pay securely',
    body: 'Keep payment conversations on-platform until escrow is live.',
  },
];

const TRUST_ITEMS = [
  {
    icon: ShieldCheck,
    title: 'Verified people',
    body: 'KYC-backed identities so you know who you are hiring or working with.',
  },
  {
    icon: Lock,
    title: 'Secure payments',
    body: 'Payment options stay visible on the project — Magobo never asks you to go off-platform.',
  },
  {
    icon: MessageCircle,
    title: 'On-platform chat',
    body: 'Negotiation, files and revisions stay in Magobo so both sides have a record.',
  },
  {
    icon: ClipboardList,
    title: 'Clear status',
    body: 'Every gig has a lifecycle you can see — from proposals through completion and reviews.',
  },
];

export default async function Home() {
  let recommended: Awaited<ReturnType<typeof discoverGigs>> | null = null;
  try {
    recommended = await discoverGigs({ page: 1, pageSize: 6 });
  } catch {
    recommended = null;
  }

  return (
    <div className="bg-background flex flex-1 flex-col">
      <section id="categories" className="mx-auto w-full max-w-6xl scroll-mt-24 px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <p className="text-primary text-xs font-semibold tracking-[0.18em] uppercase">Explore</p>
        <h1 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight sm:text-5xl">
          Every kind of work, in one marketplace
        </h1>
        <p className="text-muted-foreground mt-4 max-w-xl text-base sm:text-lg">
          Nine categories covering hundreds of services — each provider verified, rated and reviewable.
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {MARKETING_CATEGORIES.map((category) => {
            const Icon = category.icon;
            return (
              <Link
                key={category.slug}
                href={`/gigs?q=${encodeURIComponent(category.name)}`}
                className="bg-muted/50 hover:border-primary/30 group flex flex-col gap-4 rounded-2xl border border-transparent p-5 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="bg-accent text-primary flex size-10 items-center justify-center rounded-full">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <span className="text-muted-foreground text-xs">{category.servicesLabel}</span>
                </div>
                <div>
                  <h2 className="font-semibold">{category.name}</h2>
                  <p className="text-muted-foreground mt-1 text-sm">{category.description}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-primary text-xs font-semibold tracking-[0.18em] uppercase">Recommended for you</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">Providers people keep hiring</h2>
            <p className="text-muted-foreground mt-2 max-w-xl text-sm sm:text-base">
              Open gigs from verified posters — ranked by what is live on Magobo right now.
            </p>
          </div>
          <Link href="/gigs" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
            View all
          </Link>
        </div>

        {recommended && recommended.items.length > 0 ? (
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {recommended.items.map((gig) => (
              <GigCard key={gig.id} gig={gig} />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground mt-8 rounded-2xl border border-dashed px-6 py-12 text-center text-sm">
            No open gigs yet. Be the first to{' '}
            <Link href="/gigs/new" className="text-primary font-medium underline-offset-4 hover:underline">
              post a gig
            </Link>
            .
          </p>
        )}
      </section>

      <section id="how-it-works" className="bg-muted/50 scroll-mt-24 py-16">
        <div className="mx-auto w-full max-w-6xl px-4 text-center sm:px-6 lg:px-8">
          <p className="text-primary text-xs font-semibold tracking-[0.18em] uppercase">How Magobo works</p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
            From posted to paid, without leaving the platform
          </h2>
          <p className="text-muted-foreground mx-auto mt-3 max-w-2xl text-sm sm:text-base">
            Post, hire, message and complete work in one place — no off-platform chasing.
          </p>
          <div className="mt-10 grid gap-4 text-left sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, index) => (
              <div key={step.n} className="bg-background rounded-2xl p-5 shadow-sm ring-1 ring-black/5">
                <span
                  className={cn(
                    'mb-4 inline-flex size-8 items-center justify-center rounded-full text-xs font-semibold',
                    index === STEPS.length - 1
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground',
                  )}
                >
                  {step.n}
                </span>
                <h3 className="font-semibold">{step.title}</h3>
                <p className="text-muted-foreground mt-2 text-sm">{step.body}</p>
                {index === STEPS.length - 1 ? <div className="bg-primary mt-5 h-1 w-full rounded-full" /> : null}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="trust" className="mx-auto w-full max-w-6xl scroll-mt-24 px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-primary text-xs font-semibold tracking-[0.18em] uppercase">Trust & protection</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
              Built so both sides can rely on the deal
            </h2>
            <p className="text-muted-foreground mt-4 text-sm sm:text-base">
              Magobo is designed around verification, on-platform communication and a clear gig lifecycle — so
              clients and providers always know where they stand.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {TRUST_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="rounded-2xl border p-5">
                  <Icon className="text-primary size-5" aria-hidden="true" />
                  <h3 className="mt-3 font-semibold">{item.title}</h3>
                  <p className="text-muted-foreground mt-2 text-sm">{item.body}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="bg-primary text-primary-foreground rounded-3xl px-6 py-14 text-center sm:px-12">
          <p className="bg-primary-foreground/15 mx-auto inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium">
            <Sparkles className="size-3.5" aria-hidden="true" />
            Free to post — you only pay when you hire
          </p>
          <h2 className="mx-auto mt-5 max-w-xl text-2xl font-semibold tracking-tight sm:text-4xl">
            Post your first gig and get proposals today.
          </h2>
          <p className="text-primary-foreground/80 mx-auto mt-4 max-w-lg text-sm sm:text-base">
            Verified providers are ready to quote on your work. Keep hiring, messaging and reviews on Magobo.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/gigs/new"
              className={cn(buttonVariants({ size: 'lg', variant: 'secondary' }), 'bg-background text-primary hover:bg-background/90')}
            >
              Post a gig
            </Link>
            <Link
              href="/gigs"
              className="inline-flex h-11 items-center justify-center rounded-lg border border-white/40 px-5 text-sm font-medium"
            >
              Browse providers
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
