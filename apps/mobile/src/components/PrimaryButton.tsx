import { ActivityIndicator, Pressable, StyleSheet, Text, type PressableProps } from 'react-native';
import { colors } from '@/theme/colors';

export interface PrimaryButtonProps extends PressableProps {
  label: string;
  loading?: boolean;
  variant?: 'primary' | 'outline';
}

export function PrimaryButton({
  label,
  loading,
  variant = 'primary',
  disabled,
  style,
  ...props
}: PrimaryButtonProps) {
  const isOutline = variant === 'outline';

  return (
    <Pressable
      disabled={disabled || loading}
      style={(state) => [
        styles.base,
        isOutline ? styles.outline : styles.filled,
        (disabled || loading) && styles.disabled,
        typeof style === 'function' ? style(state) : style,
      ]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={isOutline ? colors.primary : colors.primaryForeground} />
      ) : (
        <Text style={isOutline ? styles.outlineLabel : styles.filledLabel}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 46,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  filled: {
    backgroundColor: colors.primary,
  },
  outline: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  disabled: {
    opacity: 0.6,
  },
  filledLabel: {
    color: colors.primaryForeground,
    fontSize: 15,
    fontWeight: '600',
  },
  outlineLabel: {
    color: colors.foreground,
    fontSize: 15,
    fontWeight: '600',
  },
});
