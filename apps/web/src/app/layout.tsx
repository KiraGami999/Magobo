import type { Metadata } from 'next';
import { Inter, Geist_Mono } from 'next/font/google';
import { Toaster } from '@/components/ui/sonner';
import { MainChrome } from '@/components/magobo/main-chrome';
import './globals.css';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: {
    default: 'Magobo — Hire local. Get work done.',
    template: '%s | Magobo',
  },
  description:
    'Magobo connects individuals, freelancers, and businesses to post gigs, hire service providers, and get paid — safely, transparently, and entirely on-platform.',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={`${inter.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col overflow-x-hidden">
        <MainChrome>{children}</MainChrome>
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
