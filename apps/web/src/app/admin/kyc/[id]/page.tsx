"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import type { AdminKycCaseDetail } from "@magobo/shared";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { LoadingState } from "@/components/magobo/loading-state";
import { ErrorState } from "@/components/magobo/error-state";
import { apiGet, apiPost } from "@/lib/api-client";
import { useCurrentUser } from "@/lib/use-current-user";

export default function AdminKycDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { user, loading: authLoading } = useCurrentUser();
  const [kycCase, setKycCase] = useState<AdminKycCaseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [acting, setActing] = useState(false);

  const load = useCallback(async () => {
    if (!params.id) return;
    setLoading(true);
    setError(null);
    const response = await apiGet<{ case: AdminKycCaseDetail }>(`/api/admin/kyc/${params.id}`);
    if (!response.success) {
      setError(response.error.message);
      setLoading(false);
      return;
    }
    setKycCase(response.data.case);
    setLoading(false);
  }, [params.id]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
      return;
    }
    if (user && !user.roles.includes("ADMIN")) {
      router.replace("/");
      return;
    }
    if (user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      void load();
    }
  }, [authLoading, user, router, load]);

  async function approve() {
    if (!params.id) return;
    setActing(true);
    const response = await apiPost(`/api/admin/kyc/${params.id}/approve`, {});
    setActing(false);
    if (!response.success) {
      toast.error(response.error.message);
      return;
    }
    toast.success("KYC approved.");
    router.push("/admin/kyc");
  }

  async function reject() {
    if (!params.id || reason.trim().length < 5) {
      toast.error("Provide a rejection reason (at least 5 characters).");
      return;
    }
    setActing(true);
    const response = await apiPost(`/api/admin/kyc/${params.id}/reject`, { reason });
    setActing(false);
    if (!response.success) {
      toast.error(response.error.message);
      return;
    }
    toast.success("KYC rejected.");
    router.push("/admin/kyc");
  }

  if (authLoading || loading) return <LoadingState />;
  if (error) return <ErrorState description={error} onRetry={load} />;
  if (!kycCase) return null;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{kycCase.userFullName}</h1>
          <p className="text-muted-foreground text-sm">{kycCase.status.replaceAll("_", " ")}</p>
        </div>
        <Link href="/admin/kyc" className={buttonVariants({ variant: "ghost", size: "sm" })}>
          Back
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Documents</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {kycCase.documents.map((doc) => (
            <div key={doc.id} className="flex flex-col gap-1 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium">{doc.documentType.replaceAll("_", " ")}</p>
                <p className="text-muted-foreground text-xs">{doc.originalFileName}</p>
              </div>
              <a href={doc.reviewUrl} target="_blank" rel="noreferrer" className={buttonVariants({ variant: "outline", size: "sm" })}>
                View
              </a>
            </div>
          ))}
        </CardContent>
      </Card>

      {(kycCase.status === "PENDING" || kycCase.status === "UNDER_REVIEW") && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Decision</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input placeholder="Rejection reason (if rejecting)" value={reason} onChange={(e) => setReason(e.target.value)} />
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button onClick={approve} disabled={acting}>
                Approve
              </Button>
              <Button variant="destructive" onClick={reject} disabled={acting}>
                Reject
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
