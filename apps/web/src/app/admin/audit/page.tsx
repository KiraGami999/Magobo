'use client';

import { useCallback, useEffect, useState } from 'react';
import type { AuditLogEntry, PaginatedResult } from '@magobo/shared';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingState } from '@/components/magobo/loading-state';
import { ErrorState } from '@/components/magobo/error-state';
import { apiGet } from '@/lib/api-client';

export default function AdminAuditPage() {
  const [result, setResult] = useState<PaginatedResult<AuditLogEntry> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const response = await apiGet<PaginatedResult<AuditLogEntry>>('/api/admin/audit-logs');
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

  if (loading && !result) return <LoadingState page />;
  if (error) return <ErrorState page description={error} onRetry={load} />;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold">Audit log</h2>
        <p className="text-muted-foreground text-sm">Immutable record of admin actions.</p>
      </div>

      {result?.items.length === 0 ? (
        <Card>
          <CardContent className="text-muted-foreground py-8 text-center text-sm">No audit entries yet.</CardContent>
        </Card>
      ) : (
        result?.items.map((entry) => (
          <Card key={entry.id}>
            <CardHeader className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="text-base">{entry.action.replaceAll('_', ' ')}</CardTitle>
              <p className="text-muted-foreground text-xs">{new Date(entry.createdAt).toLocaleString()}</p>
            </CardHeader>
            <CardContent className="text-muted-foreground space-y-1 text-sm">
              <p className="break-all">
                {entry.targetType} · {entry.targetId}
              </p>
              {entry.actorName ? <p>By {entry.actorName}</p> : null}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
