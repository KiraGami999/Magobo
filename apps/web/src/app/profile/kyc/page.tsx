"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { OwnKycStatus } from "@magobo/shared";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingState } from "@/components/magobo/loading-state";
import { ErrorState } from "@/components/magobo/error-state";
import { apiGet, apiPost } from "@/lib/api-client";
import { useCurrentUser } from "@/lib/use-current-user";

const DOCUMENT_LABELS: Record<string, string> = {
  GOVERNMENT_ID_FRONT: "Government ID (front)",
  GOVERNMENT_ID_BACK: "Government ID (back)",
  SELFIE: "Selfie with ID",
  BUSINESS_REGISTRATION: "Business registration",
  PROOF_OF_ADDRESS: "Proof of address",
};

export default function KycPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useCurrentUser();
  const [kyc, setKyc] = useState<OwnKycStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const response = await apiGet<{ kyc: OwnKycStatus }>("/api/kyc/me");
    if (!response.success) {
      setError(response.error.message);
      setLoading(false);
      return;
    }
    setKyc(response.data.kyc);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
      return;
    }
    if (user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      void load();
    }
  }, [authLoading, user, router, load]);

  async function uploadDocument(documentType: string, file: File) {
    setUploading(documentType);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("documentType", documentType);

    const response = await fetch("/api/kyc/documents", { method: "POST", body: formData });
    const body = (await response.json()) as { success: boolean; error?: { message: string } };
    setUploading(null);

    if (!body.success) {
      toast.error(body.error?.message ?? "Upload failed.");
      return;
    }

    toast.success("Document uploaded.");
    await load();
  }

  async function submitKyc() {
    setSubmitting(true);
    const response = await apiPost<{ kyc: OwnKycStatus }>("/api/kyc/submit", {});
    setSubmitting(false);

    if (!response.success) {
      toast.error(response.error.message);
      return;
    }

    toast.success("Submitted for review.");
    setKyc(response.data.kyc);
  }

  if (authLoading || loading) return <LoadingState page />;
  if (error) return <ErrorState page description={error} onRetry={load} />;
  if (!kyc) return null;

  const canEdit = kyc.status === "NOT_STARTED" || kyc.status === "REJECTED";
  const uploadedTypes = new Set(kyc.uploadedDocuments.map((d) => d.documentType));

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Identity verification</h1>
          <p className="text-muted-foreground text-sm">Upload documents to verify your identity on Magobo.</p>
        </div>
        <Link href="/profile" className={buttonVariants({ variant: "ghost", size: "sm" })}>
          Back
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Status: {kyc.status.replaceAll("_", " ")}</CardTitle>
          {kyc.rejectionReason && (
            <CardDescription className="text-destructive">{kyc.rejectionReason}</CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {kyc.requiredDocuments.map((docType) => (
            <div key={docType} className="flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium">{DOCUMENT_LABELS[docType] ?? docType}</p>
                <p className="text-muted-foreground text-xs">
                  {uploadedTypes.has(docType) ? "Uploaded" : "Required"}
                </p>
              </div>
              {canEdit && (
                <label className={buttonVariants({ variant: "outline", size: "sm", className: "cursor-pointer" })}>
                  {uploading === docType ? "Uploading…" : uploadedTypes.has(docType) ? "Replace" : "Upload"}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    className="sr-only"
                    disabled={Boolean(uploading)}
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) void uploadDocument(docType, file);
                    }}
                  />
                </label>
              )}
            </div>
          ))}

          {canEdit && (
            <Button className="w-full" onClick={submitKyc} disabled={submitting}>
              {submitting ? "Submitting…" : "Submit for review"}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
