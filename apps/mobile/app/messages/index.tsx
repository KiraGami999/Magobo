import { useCallback, useEffect, useState } from 'react';
import { Link } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { ConversationSummary } from '@magobo/shared';
import { apiGet } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';
import { colors } from '@/theme/colors';

export default function MobileMessagesScreen() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);

  const load = useCallback(async () => {
    const response = await apiGet<{ items: ConversationSummary[] }>('/api/conversations');
    if (response.success) setConversations(response.data.items);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  if (!user) {
    return (
      <View style={styles.centered}>
        <Text style={styles.subtitle}>Sign in to view messages.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Messages</Text>
      {conversations.length === 0 ? (
        <Text style={styles.subtitle}>No conversations yet.</Text>
      ) : (
        conversations.map((conversation) => (
          <Link key={conversation.id} href={`/messages/${conversation.id}`} style={styles.card}>
            <Text style={styles.cardTitle}>{conversation.gig.title}</Text>
            <Text style={styles.meta}>{conversation.otherParticipant.fullName}</Text>
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
