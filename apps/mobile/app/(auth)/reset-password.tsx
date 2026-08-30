import { useState } from 'react';
import { Link, useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { resetPasswordSchema } from '@magobo/shared';
import { FormField } from '@/components/FormField';
import { PrimaryButton } from '@/components/PrimaryButton';
import { apiPost } from '@/lib/api-client';
import { colors } from '@/theme/colors';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    setErrors({});

    const parsed = resetPasswordSchema.safeParse({ token, password });
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      setErrors(
        Object.fromEntries(
          Object.entries(fieldErrors).map(([key, messages]) => [key, messages?.[0] ?? '']),
        ),
      );
      return;
    }

    setSubmitting(true);
    const response = await apiPost('/api/auth/reset-password', parsed.data);
    setSubmitting(false);

    if (!response.success) {
      setErrors({ token: response.error.message });
      return;
    }

    router.replace('/(auth)/login');
  }

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Reset your password</Text>
      <Text style={styles.subtitle}>Enter the code we sent you and choose a new password.</Text>

      <FormField label="Reset code" value={token} onChangeText={setToken} error={errors.token} />

      <FormField
        label="New password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        error={errors.password}
      />

      <PrimaryButton label="Update password" loading={submitting} onPress={handleSubmit} />

      <Link href="/(auth)/login" style={styles.link}>
        Back to log in
      </Link>
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
    textAlign: 'center',
    marginTop: 8,
  },
});
