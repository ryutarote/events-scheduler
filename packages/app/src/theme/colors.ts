// iOS-style Dark Mode Color Scheme

export const colors = {
  // Primary accent color (red)
  accent: '#FF3B30',
  accentLight: '#FF6961',

  // Background colors
  background: {
    light: '#F2F2F7',
    dark: '#000000',
  },
  backgroundSecondary: {
    light: '#FFFFFF',
    dark: '#1C1C1E',
  },
  backgroundTertiary: {
    light: '#F2F2F7',
    dark: '#2C2C2E',
  },

  // Text colors
  text: {
    light: '#000000',
    dark: '#FFFFFF',
  },
  textSecondary: {
    light: '#8E8E93',
    dark: '#8E8E93',
  },
  textTertiary: {
    light: '#C7C7CC',
    dark: '#48484A',
  },

  // Separator colors
  separator: {
    light: '#C6C6C8',
    dark: '#38383A',
  },

  // Card colors
  card: {
    light: '#FFFFFF',
    dark: '#1C1C1E',
  },

  // Icon box colors
  iconBox: {
    calendar: '#FF3B30',
    time: '#007AFF',
    reminder: '#FF9500',
    link: '#007AFF',
    notes: '#FFCC00',
    timer: '#5856D6',
  },

  // System colors
  blue: '#007AFF',
  green: '#34C759',
  orange: '#FF9500',
  yellow: '#FFCC00',
  purple: '#5856D6',
  pink: '#FF2D55',

  // Weekend colors
  sunday: '#FF3B30',
  saturday: '#007AFF',
};

export type ColorScheme = 'light' | 'dark';

export const getColor = (
  colorKey: keyof typeof colors.background,
  scheme: ColorScheme
): string => {
  const colorValue = colors.background[colorKey];
  if (typeof colorValue === 'string') return colorValue;
  return scheme === 'dark' ? colors.background.dark : colors.background.light;
};

// Helper to get themed colors
export const getThemedColors = (isDark: boolean) => ({
  background: isDark ? colors.background.dark : colors.background.light,
  backgroundSecondary: isDark ? colors.backgroundSecondary.dark : colors.backgroundSecondary.light,
  backgroundTertiary: isDark ? colors.backgroundTertiary.dark : colors.backgroundTertiary.light,
  text: isDark ? colors.text.dark : colors.text.light,
  textSecondary: isDark ? colors.textSecondary.dark : colors.textSecondary.light,
  textTertiary: isDark ? colors.textTertiary.dark : colors.textTertiary.light,
  separator: isDark ? colors.separator.dark : colors.separator.light,
  card: isDark ? colors.card.dark : colors.card.light,
  accent: colors.accent,
});
