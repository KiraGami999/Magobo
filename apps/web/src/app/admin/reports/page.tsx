'use client';

import { useCallback, useEffect, useState } from 'react';
import type { AdminReportSummary, PaginatedResult } from '@magobo/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingState } from '@/components/magobo/loading-state';
import { ErrorState } from '@/components/magobo/error-state';
import { StatusBadge } from '@/components/magobo/status-badge';
import { apiGet, apiPost } from '@/lib/api-client';

export default function AdminReportsPage() {
  const [result, setResult] = useState<PaginatedResult<AdminReportSummary> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyReportId, setBusyReportId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const response = await apiGet<PaginatedResult<AdminReportSummary>>('/api/admin/reports');
    if (!response.success) {
      setError(response.error.message);
      setLoading(false);
      return;
    }
    setResult(response.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  async function handleResolve(reportId: string, status: 'RESOLVED' | 'DISMISSED') {
    const resolutionNote = window.prompt('Optional resolution note:') ?? undefined;
    setBusyReportId(reportId);
    setActionError(null);
    const response = await apiPost(`/api/admin/reports/${reportId}/resolve`, {
      status,
      ...(resolutionNote?.trim() ? { resolutionNote: resolutionNote.trim() } : {}),
    });
    setBusyReportId(null);
    if (!response.success) {
      setActionError(response.error.message);
      return;
    }
    await load();
  }

  if (loading && !result) return <LoadingState page />;
  if (error) return <ErrorState page description={error} onRetry={load} />;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold">Reports</h2>
        <p className="text-muted-foreground text-sm">User-submitted reports awaiting review.</p>
      </div>

      {actionError ? <p className="text-destructive text-sm">{actionError}</p> : null}

      {result?.items.length === 0 ? (
        <Card>
          <CardContent className="text-muted-foreground py-8 text-center text-sm">No reports.</CardContent>
        </Card>
      ) : (
        result?.items.map((report) => (
          <Card key={report.id}>
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle className="text-base">
                  {report.reason.replaceAll('_', ' ')} · {report.targetType}
                </CardTitle>
                <p className="text-muted-foreground text-sm">Reported by {report.reporterName}</p>
                <p className="text-muted-foreground mt-1 text-xs">Target ID: {report.targetId}</p>
              </div>
              <StatusBadge label={report.status.replaceAll('_', ' ')} />
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <p className="text-sm">{report.description}</p>
              {report.status === 'OPEN' || report.status === 'UNDER_REVIEW' ? (
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    disabled={busyReportId === report.id}
                    onClick={() => handleResolve(report.id, 'RESOLVED')}
                  >
                    Resolve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busyReportId === report.id}
                    onClick={() => handleResolve(report.id, 'DISMISSED')}
                  >
                    Dismiss
                  </Button>
                </div>
              ) : null}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
