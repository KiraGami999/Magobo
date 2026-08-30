import { Text, View, StyleSheet } from 'react-native';
import { colors } from '@/theme/colors';

/** Mobile gig creation — full form coming in a follow-up; use web for now. */
export default function MobileNewGigScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Post a gig</Text>
      <Text style={styles.subtitle}>
        Use the Magobo web app to create and publish gigs for now. Mobile creation will be added in a follow-up.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, gap: 12, backgroundColor: colors.background },
  title: { fontSize: 24, fontWeight: '700', color: colors.foreground },
  subtitle: { fontSize: 14, lineHeight: 22, color: colors.mutedForeground },
});
