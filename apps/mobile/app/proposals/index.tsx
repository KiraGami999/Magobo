import { useCallback, useEffect, useState } from 'react';
import { Link } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { PublicProposal } from '@magobo/shared';
import { apiGet } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';
import { colors } from '@/theme/colors';

export default function MyProposalsScreen() {
  const { user } = useAuth();
  const [proposals, setProposals] = useState<PublicProposal[]>([]);

  const load = useCallback(async () => {
    const response = await apiGet<{ items: PublicProposal[] }>('/api/proposals/mine');
    if (response.success) setProposals(response.data.items);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  if (!user) {
    return (
      <View style={styles.centered}>
        <Text style={styles.subtitle}>Sign in to view your proposals.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>My proposals</Text>
      {proposals.length === 0 ? (
        <Text style={styles.subtitle}>No proposals yet. Browse gigs to get started.</Text>
      ) : (
        proposals.map((proposal) => (
          <Link key={proposal.id} href={`/proposals/${proposal.id}`} style={styles.card}>
            <Text style={styles.cardTitle}>{proposal.gig?.title ?? 'Gig'}</Text>
            <Text style={styles.meta}>{proposal.status.replaceAll('_', ' ')}</Text>
          </Link>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, gap: 12, backgroundColor: colors.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  title: { fontSize: 24, fontWeight: '700', color: colors.foreground },
  subtitle: { fontSize: 14, color: colors.mutedForeground },
  card: { borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 16, gap: 4 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: colors.foreground },
  meta: { fontSize: 13, color: colors.mutedForeground },
});
