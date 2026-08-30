/**
 * Mobile color tokens, kept in sync with the web design system
 * (`apps/web/src/app/globals.css`). Update both together.
 */
export const colors = {
  background: '#FFFFFF',
  foreground: '#171717',
  muted: '#F4F4F5',
  mutedForeground: '#71717A',
  border: '#E5E7EB',
  primary: '#2554D9',
  primaryForeground: '#FFFFFF',
  success: '#059669',
  successForeground: '#FFFFFF',
  warning: '#F59E0B',
  warningForeground: '#3F2A05',
  destructive: '#DC2626',
  destructiveForeground: '#FFFFFF',
  info: '#2C7FD1',
  infoForeground: '#FFFFFF',
} as const;

export type ColorToken = keyof typeof colors;
