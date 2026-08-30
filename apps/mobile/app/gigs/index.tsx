import { useCallback, useEffect, useState } from 'react';
import { Link } from 'expo-router';
import { ScrollView, StyleSheet, Text } from 'react-native';
import type { PaginatedResult, PublicGig } from '@magobo/shared';
import { PrimaryButton } from '@/components/PrimaryButton';
import { apiGet } from '@/lib/api-client';
import { colors } from '@/theme/colors';

function formatBudget(gig: PublicGig): string {
  const amount = gig.budget.maxMinor ?? gig.budget.minMinor;
  if (amount === null) return 'Budget TBD';
  return `${(amount / 100).toLocaleString()} ${gig.budget.currency}`;
}

export default function MobileGigsScreen() {
  const [gigs, setGigs] = useState<PublicGig[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const response = await apiGet<PaginatedResult<PublicGig>>('/api/gigs');
    if (response.success) setGigs(response.data.items);
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Browse gigs</Text>
      {loading && <Text style={styles.subtitle}>Loading…</Text>}
      {!loading && gigs.length === 0 && <Text style={styles.subtitle}>No gigs found yet.</Text>}
      {gigs.map((gig) => (
        <Link key={gig.id} href={`/gigs/${gig.id}`} style={styles.card}>
          <Text style={styles.cardTitle}>{gig.title}</Text>
          <Text style={styles.cardMeta}>{gig.category.name} · {formatBudget(gig)}</Text>
          <Text style={styles.cardDesc} numberOfLines={2}>{gig.description}</Text>
        </Link>
      ))}
      <Link href="/gigs/new" asChild>
        <PrimaryButton label="Post a gig" />
      </Link>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, gap: 12, backgroundColor: colors.background },
  title: { fontSize: 24, fontWeight: '700', color: colors.foreground, marginBottom: 8 },
  subtitle: { fontSize: 14, color: colors.mutedForeground },
  card: { borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 14, gap: 4 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: colors.foreground },
  cardMeta: { fontSize: 12, color: colors.mutedForeground },
  cardDesc: { fontSize: 13, color: colors.foreground, marginTop: 4 },
});
