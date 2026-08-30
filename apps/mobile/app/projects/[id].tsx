import { useCallback, useEffect, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { PublicProject } from '@magobo/shared';
import { PrimaryButton } from '@/components/PrimaryButton';
import { apiGet, apiPost } from '@/lib/api-client';
import { colors } from '@/theme/colors';

export default function MobileProjectDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [project, setProject] = useState<PublicProject | null>(null);
  const [acting, setActing] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    const response = await apiGet<{ project: PublicProject }>(`/api/gigs/${id}/project`);
    if (response.success) setProject(response.data.project);
  }, [id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  async function startProject() {
    if (!id) return;
    setActing(true);
    await apiPost(`/api/gigs/${id}/project/start`, {});
    setActing(false);
    await load();
  }

  if (!project) {
    return (
      <View style={styles.centered}>
        <Text style={styles.subtitle}>Loading…</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{project.gigTitle}</Text>
      <Text style={styles.meta}>{project.gigStatus.replaceAll('_', ' ')}</Text>
      <Text style={styles.meta}>
        {project.milestones.length} milestones · {project.deliverables.length} submissions
      </Text>
      {project.canStart && (
        <PrimaryButton label={acting ? 'Starting…' : 'Start project'} onPress={startProject} disabled={acting} />
      )}
      <Text style={styles.subtitle}>
        Full project actions are available on the web app for now.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, gap: 12, backgroundColor: colors.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  title: { fontSize: 22, fontWeight: '700', color: colors.foreground },
  meta: { fontSize: 13, color: colors.mutedForeground },
  subtitle: { fontSize: 14, color: colors.mutedForeground, marginTop: 8 },
});
