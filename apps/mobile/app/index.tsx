import { Link } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBadge } from '@/components/StatusBadge';
import { PrimaryButton } from '@/components/PrimaryButton';
import { useAuth } from '@/lib/auth-context';
import { colors } from '@/theme/colors';

export default function HomeScreen() {
  const { user, loading, logout } = useAuth();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Hire local. Get work done.</Text>
      <Text style={styles.subtitle}>
        Magobo connects individuals, freelancers, and businesses to post gigs, submit proposals,
        negotiate, communicate, and get paid — safely and entirely on-platform.
      </Text>

      {!loading && (
        <View style={styles.authSection}>
          {user ? (
            <>
              <Text style={styles.greeting}>Hi, {user.fullName.split(' ')[0]}</Text>
              <Link href="/gigs" asChild>
                <PrimaryButton label="Browse gigs" variant="outline" />
              </Link>
              {user.roles.includes('SERVICE_PROVIDER') && (
                <Link href="/proposals" asChild>
                  <PrimaryButton label="My proposals" variant="outline" />
                </Link>
              )}
              <Link href="/messages" asChild>
                <PrimaryButton label="Messages" variant="outline" />
              </Link>
              <Link href="/projects" asChild>
                <PrimaryButton label="Projects" variant="outline" />
              </Link>
              <Link href="/profile" asChild>
                <PrimaryButton label="Profile" variant="outline" />
              </Link>
              <PrimaryButton label="Log out" variant="outline" onPress={logout} />
            </>
          ) : (
            <>
              <Link href="/(auth)/register" asChild>
                <PrimaryButton label="Get started" />
              </Link>
              <Link href="/(auth)/login" asChild>
                <PrimaryButton label="Log in" variant="outline" />
              </Link>
            </>
          )}
        </View>
      )}

      <View style={styles.badgeRow}>
        <StatusBadge tone="info" label="Receiving proposals" />
        <StatusBadge tone="warning" label="Negotiating" />
        <StatusBadge tone="success" label="Completed" />
        <StatusBadge tone="destructive" label="Disputed" />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: colors.background,
    padding: 24,
    gap: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.foreground,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.mutedForeground,
  },
  authSection: {
    gap: 10,
    marginTop: 8,
  },
  greeting: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.foreground,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
});
