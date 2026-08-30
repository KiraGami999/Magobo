import { useCallback, useEffect, useState } from "react";
import { Link, useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import type { OwnProfile } from "@magobo/shared";
import { PrimaryButton } from "@/components/PrimaryButton";
import { useAuth } from "@/lib/auth-context";
import { apiGet, apiPost } from "@/lib/api-client";
import { colors } from "@/theme/colors";

export default function ProfileScreen() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<OwnProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const response = await apiGet<{ profile: OwnProfile }>("/api/profile/me");
    if (response.success) setProfile(response.data.profile);
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

  async function enableProvider() {
    const response = await apiPost("/api/profile/me/roles", { role: "SERVICE_PROVIDER" });
    if (response.success) await load();
  }

  if (authLoading || loading) {
    return (
      <View style={styles.centered}>
        <Text style={styles.subtitle}>Loading profile…</Text>
      </View>
    );
  }

  if (!profile) return null;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Your profile</Text>
      <Text style={styles.subtitle}>KYC status: {profile.kycStatus.replaceAll("_", " ")}</Text>

      {!profile.userProfile && (
        <PrimaryButton label="Enable service provider" onPress={enableProvider} />
      )}

      {profile.userProfile && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Provider profile</Text>
          <Text style={styles.cardText}>{profile.userProfile.bio ?? "No bio yet."}</Text>
          <Text style={styles.cardText}>
            {profile.userProfile.location.city ?? "Location not set"}
          </Text>
        </View>
      )}

      <Link href="/profile/kyc" asChild>
        <PrimaryButton label="Manage verification" variant="outline" />
      </Link>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, gap: 16, backgroundColor: colors.background },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background },
  title: { fontSize: 24, fontWeight: "700", color: colors.foreground },
  subtitle: { fontSize: 14, color: colors.mutedForeground },
  card: { borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 16, gap: 8 },
  cardTitle: { fontSize: 16, fontWeight: "600", color: colors.foreground },
  cardText: { fontSize: 14, color: colors.mutedForeground },
});
