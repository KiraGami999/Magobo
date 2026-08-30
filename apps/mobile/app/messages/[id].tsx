import { useCallback, useEffect, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import type { PublicConversation, PublicMessage } from '@magobo/shared';
import { PrimaryButton } from '@/components/PrimaryButton';
import { apiGet, apiPost } from '@/lib/api-client';
import { colors } from '@/theme/colors';

export default function MobileConversationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [conversation, setConversation] = useState<PublicConversation | null>(null);
  const [messages, setMessages] = useState<PublicMessage[]>([]);
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    const response = await apiGet<{
      conversation: PublicConversation;
      messages: { items: PublicMessage[] };
    }>(`/api/conversations/${id}`);
    if (!response.success) return;
    setConversation(response.data.conversation);
    setMessages(response.data.messages.items);
  }, [id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  async function handleSend() {
    if (!id || !body.trim()) return;
    setSending(true);
    const response = await apiPost<{ message: PublicMessage }>(
      `/api/conversations/${id}/messages`,
      { body: body.trim() },
    );
    setSending(false);
    if (!response.success) return;
    setBody('');
    setMessages((current) => [...current, response.data.message]);
  }

  if (!conversation) {
    return (
      <View style={styles.centered}>
        <Text style={styles.subtitle}>Loading…</Text>
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>{conversation.gig.title}</Text>
        <Text style={styles.meta}>with {conversation.otherParticipant.fullName}</Text>
        {messages.map((message) => (
          <View key={message.id} style={styles.bubble}>
            <Text style={styles.author}>{message.senderName}</Text>
            <Text style={styles.body}>{message.body}</Text>
          </View>
        ))}
      </ScrollView>
      {conversation.canSend && (
        <View style={styles.composer}>
          <TextInput
            style={styles.input}
            value={body}
            onChangeText={setBody}
            placeholder="Type a message…"
            multiline
          />
          <PrimaryButton label={sending ? 'Sending…' : 'Send'} onPress={handleSend} disabled={sending} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: colors.background },
  container: { padding: 24, gap: 12 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  title: { fontSize: 20, fontWeight: '700', color: colors.foreground },
  meta: { fontSize: 13, color: colors.mutedForeground, marginBottom: 8 },
  bubble: { borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 12, gap: 4 },
  author: { fontSize: 12, fontWeight: '600', color: colors.foreground },
  body: { fontSize: 15, lineHeight: 22, color: colors.foreground },
  subtitle: { fontSize: 14, color: colors.mutedForeground },
  composer: { borderTopWidth: 1, borderTopColor: colors.border, padding: 16, gap: 12 },
  input: {
    minHeight: 44,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: colors.foreground,
  },
});
