export interface Theme {
  bgPage: string;
  bgCard: string;
  bgDeep: string;
  borderDefault: string;
  borderMuted: string;
  borderSubtle: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textDisabled: string;
  textTertiary: string;
  colorScheme: 'dark' | 'light';
}

export const darkTheme: Theme = {
  bgPage: '#0a0a0f',
  bgCard: '#12121a',
  bgDeep: '#0d0d14',
  borderDefault: '#1e1e2e',
  borderMuted: '#334155',
  borderSubtle: '#0f0f1a',
  textPrimary: '#e2e8f0',
  textSecondary: '#94a3b8',
  textMuted: '#64748b',
  textDisabled: '#475569',
  textTertiary: '#334155',
  colorScheme: 'dark',
};

export const lightTheme: Theme = {
  bgPage: '#f1f5f9',
  bgCard: '#ffffff',
  bgDeep: '#f8fafc',
  borderDefault: '#e2e8f0',
  borderMuted: '#cbd5e1',
  borderSubtle: '#f1f5f9',
  textPrimary: '#0f172a',
  textSecondary: '#334155',
  textMuted: '#64748b',
  textDisabled: '#94a3b8',
  textTertiary: '#cbd5e1',
  colorScheme: 'light',
};

/** Adapts white/black icon colors so they stay visible in both themes. */
export function resolveIconColor(color: string, colorScheme: 'dark' | 'light'): string {
  if (color === '#ffffff' && colorScheme === 'light') return '#000000';
  if (color === '#000000' && colorScheme === 'dark') return '#ffffff';
  return color;
}
