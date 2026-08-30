'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import type { AdminDashboardStats } from '@magobo/shared';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { buttonVariants } from '@/components/ui/button';
import { LoadingState } from '@/components/magobo/loading-state';
import { ErrorState } from '@/components/magobo/error-state';
import { apiGet } from '@/lib/api-client';

function StatCard({ label, value, href }: { label: string; value: number; href?: string }) {
  const content = (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-muted-foreground text-sm font-medium">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-semibold tabular-nums">{value}</p>
      </CardContent>
    </Card>
  );

  if (href) {
    return (
      <Link href={href} className="block transition-opacity hover:opacity-90">
        {content}
      </Link>
    );
  }

  return content;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const response = await apiGet<{ stats: AdminDashboardStats }>('/api/admin/dashboard');
    if (!response.success) {
      setError(response.error.message);
      setLoading(false);
      return;
    }
    setStats(response.data.stats);
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  if (loading) return <LoadingState page />;
  if (error) return <ErrorState page description={error} onRetry={load} />;
  if (!stats) return null;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold">Overview</h2>
        <p className="text-muted-foreground text-sm">Key platform metrics at a glance.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total users" value={stats.totalUsers} href="/admin/users" />
        <StatCard label="Active users" value={stats.activeUsers} href="/admin/users" />
        <StatCard label="Suspended users" value={stats.suspendedUsers} href="/admin/users" />
        <StatCard label="Total gigs" value={stats.totalGigs} href="/admin/gigs" />
        <StatCard label="Open gigs" value={stats.openGigs} href="/admin/gigs" />
        <StatCard label="Pending KYC" value={stats.pendingKycCases} href="/admin/kyc" />
        <StatCard label="Open reports" value={stats.openReports} href="/admin/reports" />
        <StatCard label="Flagged messages" value={stats.flaggedMessages} href="/admin/moderation" />
      </div>

      <Link href="/admin/audit" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
        View audit log
      </Link>
    </div>
  );
}
