"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { AdminKycCaseSummary } from "@magobo/shared";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingState } from "@/components/magobo/loading-state";
import { ErrorState } from "@/components/magobo/error-state";
import { apiGet } from "@/lib/api-client";

export default function AdminKycPage() {
  const [cases, setCases] = useState<AdminKycCaseSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const response = await apiGet<{ cases: AdminKycCaseSummary[] }>("/api/admin/kyc");
    if (!response.success) {
      setError(response.error.message);
      setLoading(false);
      return;
    }
    setCases(response.data.cases);
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  if (loading) return <LoadingState page />;
  if (error) return <ErrorState page description={error} onRetry={load} />;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold">KYC review queue</h2>
        <p className="text-muted-foreground text-sm">Review and approve identity verification submissions.</p>
      </div>

      {cases.length === 0 ? (
        <Card>
          <CardContent className="text-muted-foreground py-8 text-center text-sm">No cases pending review.</CardContent>
        </Card>
      ) : (
        cases.map((kycCase) => (
          <Card key={kycCase.id}>
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-base">{kycCase.userFullName}</CardTitle>
                <p className="text-muted-foreground text-sm">{kycCase.userEmail ?? "No email"}</p>
              </div>
              <Link href={`/admin/kyc/${kycCase.id}`} className={buttonVariants({ size: "sm" })}>
                Review
              </Link>
            </CardHeader>
            <CardContent className="text-muted-foreground text-sm">
              {kycCase.documentCount} document(s) · {kycCase.status.replaceAll("_", " ")}
            </CardContent>
          </Card>
        ))
      )}

      <Button variant="outline" onClick={load}>
        Refresh
      </Button>
    </div>
  );
}
