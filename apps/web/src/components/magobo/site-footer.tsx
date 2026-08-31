import Link from 'next/link';
import { BrandLogo } from '@/components/magobo/brand-logo';

const FOOTER_COLUMNS = [
  {
    title: 'Marketplace',
    links: [
      { href: '/gigs', label: 'Browse gigs' },
      { href: '/#categories', label: 'Categories' },
      { href: '/gigs/new', label: 'Post a gig' },
    ],
  },
  {
    title: 'Trust',
    links: [
      { href: '/profile/kyc', label: 'KYC verification' },
      { href: '/#trust', label: 'Secure payments' },
      { href: '/#trust', label: 'Community rules' },
    ],
  },
  {
    title: 'Company',
    links: [
      { href: '/#how-it-works', label: 'How it works' },
      { href: '/#trust', label: 'Trust & safety' },
      { href: '/login', label: 'Contact' },
    ],
  },
] as const;

export function SiteFooter() {
  return (
    <footer className="border-border bg-muted/40 mt-auto border-t">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
        <div className="max-w-xs">
          <BrandLogo />
          <p className="text-muted-foreground mt-4 text-sm leading-relaxed">
            The trusted marketplace for local work. Verified people, protected payments and every
            conversation kept on-platform.
          </p>
        </div>
        {FOOTER_COLUMNS.map((column) => (
          <div key={column.title}>
            <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">{column.title}</p>
            <ul className="mt-4 space-y-2">
              {column.links.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="hover:text-primary text-sm transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-border mx-auto flex w-full max-w-6xl flex-col gap-2 border-t px-4 py-5 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <p className="text-muted-foreground">© {new Date().getFullYear()} Magobo. Built for trust.</p>
        <p className="text-muted-foreground">Blantyre · Lilongwe · Mzuzu · Zomba</p>
      </div>
    </footer>
  );
}
