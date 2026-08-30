import { useState } from 'react';
import { Link } from 'expo-router';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { requestPasswordResetSchema } from '@magobo/shared';
import { FormField } from '@/components/FormField';
import { PrimaryButton } from '@/components/PrimaryButton';
import { apiPost } from '@/lib/api-client';
import { colors } from '@/theme/colors';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit() {
    setError(null);

    const parsed = requestPasswordResetSchema.safeParse({ email });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Enter a valid email address.');
      return;
    }

    setSubmitting(true);
    await apiPost('/api/auth/forgot-password', parsed.data);
    setSubmitting(false);
    setSent(true);
  }

  if (sent) {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Check your email</Text>
        <Text style={styles.subtitle}>
          If an account exists for {email}, we&apos;ve sent a code to reset your password.
        </Text>
        <Link href="/(auth)/reset-password" style={styles.link}>
          I have a code
        </Link>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Forgot your password?</Text>
      <Text style={styles.subtitle}>We&apos;ll send you a code to reset it.</Text>

      <FormField
        label="Email address"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        error={error ?? undefined}
      />

      <PrimaryButton label="Send reset code" loading={submitting} onPress={handleSubmit} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    gap: 16,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.foreground,
  },
  subtitle: {
    fontSize: 14,
    color: colors.mutedForeground,
    marginBottom: 8,
  },
  link: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
});
