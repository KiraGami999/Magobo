import { BrandLogo } from '@/components/magobo/brand-logo';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-muted/50 flex min-h-screen flex-col">
      <header className="border-border bg-background border-b px-4 py-4 sm:px-6">
        <BrandLogo />
      </header>
      <main className="flex flex-1 items-center justify-center px-4 py-12 sm:px-6">
        <div className="w-full max-w-sm">{children}</div>
      </main>
    </div>
  );
}
