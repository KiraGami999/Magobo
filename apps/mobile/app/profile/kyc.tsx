import { useCallback, useEffect, useState } from "react";
import { Link, useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import type { OwnKycStatus } from "@magobo/shared";
import { PrimaryButton } from "@/components/PrimaryButton";
import { useAuth } from "@/lib/auth-context";
import { apiGet, apiPost } from "@/lib/api-client";
import { colors } from "@/theme/colors";

export default function MobileKycScreen() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [kyc, setKyc] = useState<OwnKycStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    const response = await apiGet<{ kyc: OwnKycStatus }>("/api/kyc/me");
    if (response.success) setKyc(response.data.kyc);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/(auth)/login");
      return;
    }
    if (user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      void load();
    }
  }, [authLoading, user, router, load]);

  async function submitKyc() {
    setSubmitting(true);
    const response = await apiPost<{ kyc: OwnKycStatus }>("/api/kyc/submit", {});
    setSubmitting(false);
    if (response.success) setKyc(response.data.kyc);
  }

  if (authLoading || loading) {
    return (
      <View style={styles.centered}>
        <Text style={styles.subtitle}>Loading verification…</Text>
      </View>
    );
  }

  if (!kyc) return null;

  const canEdit = kyc.status === "NOT_STARTED" || kyc.status === "REJECTED";

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Identity verification</Text>
      <Text style={styles.subtitle}>Status: {kyc.status.replaceAll("_", " ")}</Text>
      {kyc.rejectionReason && <Text style={styles.error}>{kyc.rejectionReason}</Text>}

      {kyc.requiredDocuments.map((docType) => (
        <View key={docType} style={styles.row}>
          <Text style={styles.rowLabel}>{docType.replaceAll("_", " ")}</Text>
          <Text style={styles.rowMeta}>
            {kyc.uploadedDocuments.some((d) => d.documentType === docType) ? "Uploaded" : "Required"}
          </Text>
        </View>
      ))}

      <Text style={styles.note}>
        Document upload from mobile uses the same secure API — use the web app to upload files for now, or integrate
        `expo-document-picker` in a follow-up.
      </Text>

      {canEdit && (
        <PrimaryButton label={submitting ? "Submitting…" : "Submit for review"} loading={submitting} onPress={submitKyc} />
      )}

      <Link href="/profile" asChild>
        <PrimaryButton label="Back to profile" variant="outline" />
      </Link>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, gap: 16, backgroundColor: colors.background },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background },
  title: { fontSize: 24, fontWeight: "700", color: colors.foreground },
  subtitle: { fontSize: 14, color: colors.mutedForeground },
  error: { color: colors.destructive, fontSize: 13 },
  row: { borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 12, gap: 4 },
  rowLabel: { fontSize: 14, fontWeight: "600", color: colors.foreground },
  rowMeta: { fontSize: 12, color: colors.mutedForeground },
  note: { fontSize: 12, color: colors.mutedForeground, lineHeight: 18 },
});
