import { useCallback, useEffect, useState } from 'react';
import { Link, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { PublicGig, PublicProposal } from '@magobo/shared';
import { PrimaryButton } from '@/components/PrimaryButton';
import { apiGet } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';
import { colors } from '@/theme/colors';

export default function MobileGigDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [gig, setGig] = useState<PublicGig | null>(null);
  const [myProposal, setMyProposal] = useState<PublicProposal | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    const response = await apiGet<{ gig: PublicGig }>(`/api/gigs/${id}`);
    if (!response.success) return;
    setGig(response.data.gig);

    const open = ['RECEIVING_PROPOSALS', 'NEGOTIATING'].includes(response.data.gig.status);
    const isProvider = user?.roles.includes('SERVICE_PROVIDER');
    const isOwner = user?.id === response.data.gig.owner.userId;

    if (open && isProvider && !isOwner) {
      const mine = await apiGet<{ proposal: PublicProposal | null }>(`/api/gigs/${id}/proposals?mine=true`);
      if (mine.success) setMyProposal(mine.data.proposal);
    }
  }, [id, user?.id, user?.roles]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const openForProposals = ['RECEIVING_PROPOSALS', 'NEGOTIATING'].includes(gig?.status ?? '');
  const isProvider = user?.roles.includes('SERVICE_PROVIDER');
  const isOwner = user?.id === gig?.owner.userId;

  if (!gig) {
    return (
      <View style={styles.centered}>
        <Text style={styles.subtitle}>Loading…</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{gig.title}</Text>
      <Text style={styles.meta}>{gig.category.name} · {gig.status.replaceAll('_', ' ')}</Text>
      <Text style={styles.body}>{gig.description}</Text>
      <Text style={styles.meta}>Posted by {gig.owner.fullName}</Text>
      {openForProposals && isProvider && !isOwner && (
        myProposal ? (
          <Link href={`/proposals/${myProposal.id}`} asChild>
            <PrimaryButton label="View your proposal" variant="outline" />
          </Link>
        ) : (
          <Text style={styles.subtitle}>
            Submit proposals on the web app for now — mobile submission coming soon.
          </Text>
        )
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, gap: 12, backgroundColor: colors.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  title: { fontSize: 24, fontWeight: '700', color: colors.foreground },
  meta: { fontSize: 13, color: colors.mutedForeground },
  body: { fontSize: 15, lineHeight: 22, color: colors.foreground },
  subtitle: { fontSize: 14, color: colors.mutedForeground },
});
