import { useCallback, useEffect, useState } from 'react';
import { Link } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { ProjectGigSummary } from '@magobo/shared';
import { apiGet } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';
import { colors } from '@/theme/colors';

export default function MobileProjectsScreen() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<ProjectGigSummary[]>([]);

  const load = useCallback(async () => {
    const response = await apiGet<{ items: ProjectGigSummary[] }>('/api/projects/mine');
    if (response.success) setProjects(response.data.items);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  if (!user) {
    return (
      <View style={styles.centered}>
        <Text style={styles.subtitle}>Sign in to view projects.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Projects</Text>
      {projects.length === 0 ? (
        <Text style={styles.subtitle}>No active projects yet.</Text>
      ) : (
        projects.map((project) => (
          <Link key={project.id} href={`/projects/${project.id}`} style={styles.card}>
            <Text style={styles.cardTitle}>{project.title}</Text>
            <Text style={styles.meta}>{project.status.replaceAll('_', ' ')} · {project.role}</Text>
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
