import { useCallback, useEffect, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { PublicProposal } from '@magobo/shared';
import { apiGet } from '@/lib/api-client';
import { colors } from '@/theme/colors';

export default function MobileProposalDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [proposal, setProposal] = useState<PublicProposal | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    const response = await apiGet<{ proposal: PublicProposal }>(`/api/proposals/${id}`);
    if (response.success) setProposal(response.data.proposal);
  }, [id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  if (!proposal) {
    return (
      <View style={styles.centered}>
        <Text style={styles.subtitle}>Loading…</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{proposal.gig?.title ?? 'Proposal'}</Text>
      <Text style={styles.meta}>{proposal.status.replaceAll('_', ' ')}</Text>
      <Text style={styles.amount}>
        {(proposal.amountMinor / 100).toLocaleString()} {proposal.currency}
      </Text>
      <Text style={styles.body}>{proposal.coverLetter}</Text>
      {proposal.negotiationEntries.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Negotiation</Text>
          {proposal.negotiationEntries.map((entry) => (
            <View key={entry.id} style={styles.entry}>
              <Text style={styles.entryAuthor}>{entry.authorName}</Text>
              <Text style={styles.body}>{entry.message}</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, gap: 12, backgroundColor: colors.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  title: { fontSize: 22, fontWeight: '700', color: colors.foreground },
  meta: { fontSize: 13, color: colors.mutedForeground },
  amount: { fontSize: 16, fontWeight: '600', color: colors.foreground },
  body: { fontSize: 15, lineHeight: 22, color: colors.foreground },
  subtitle: { fontSize: 14, color: colors.mutedForeground },
  section: { gap: 8, marginTop: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: colors.foreground },
  entry: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 12, gap: 4 },
  entryAuthor: { fontSize: 13, fontWeight: '600', color: colors.foreground },
});
