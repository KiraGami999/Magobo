import Link from 'next/link';
import { ShieldCheck, Zap, MapPin } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { StatusBadge } from '@/components/magobo/status-badge';
import { VerificationBadge } from '@/components/magobo/verification-badge';

const highlights = [
  {
    icon: ShieldCheck,
    title: 'Verified & secure',
    description: 'KYC-backed identities and on-platform payments keep every gig safe.',
  },
  {
    icon: Zap,
    title: 'Fast to hire',
    description: 'Post a gig, receive proposals, and award work in minutes.',
  },
  {
    icon: MapPin,
    title: 'Local first',
    description: 'Find trusted professionals and businesses near you.',
  },
];

export default function Home() {
  return (
    <div className="bg-background flex flex-1 flex-col">

      <main className="flex flex-1 flex-col items-center gap-16 px-4 py-16 sm:px-6 lg:px-8">
        <section className="flex max-w-2xl flex-col items-center gap-6 text-center">
          <VerificationBadge state="verified" showLabel />
          <h1 className="text-3xl font-semibold tracking-tight sm:text-5xl">
            Hire local. Get work done. Get paid — all on Magobo.
          </h1>
          <p className="text-muted-foreground max-w-xl text-base sm:text-lg">
            Magobo connects individuals, freelancers, and businesses to post gigs, submit proposals,
            negotiate, communicate, and get paid — safely and entirely on-platform.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/gigs/new" className={buttonVariants({ size: 'lg' })}>
              Post a gig
            </Link>
            <Link href="/gigs" className={buttonVariants({ size: 'lg', variant: 'outline' })}>
              Browse gigs
            </Link>
          </div>
        </section>

        <section className="grid w-full max-w-4xl gap-4 sm:grid-cols-3">
          {highlights.map(({ icon: Icon, title, description }) => (
            <Card key={title}>
              <CardHeader>
                <Icon className="text-primary size-5" aria-hidden="true" />
                <CardTitle className="text-base">{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </section>

        <section className="w-full max-w-4xl">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Example gig card status</CardTitle>
              <CardDescription>
                A preview of the trust and status indicators used throughout Magobo.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <StatusBadge tone="info" label="Receiving proposals" />
              <StatusBadge tone="warning" label="Negotiating" />
              <StatusBadge tone="success" label="Completed" />
              <StatusBadge tone="destructive" label="Disputed" />
              <StatusBadge tone="neutral" label="Draft" />
            </CardContent>
          </Card>
        </section>
      </main>

      <footer className="border-border text-muted-foreground border-t px-4 py-6 text-center text-sm sm:px-6 lg:px-8">
        © {new Date().getFullYear()} Magobo. Built for trust.
      </footer>
    </div>
  );
}
