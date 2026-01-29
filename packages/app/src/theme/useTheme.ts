import { create } from 'zustand';
import { getThemedColors } from './colors';

interface ThemeState {
  isDark: boolean;
  toggleTheme: () => void;
  setDarkMode: (isDark: boolean) => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  isDark: true, // Default to dark mode
  toggleTheme: () => set((state) => ({ isDark: !state.isDark })),
  setDarkMode: (isDark: boolean) => set({ isDark }),
}));

export const useTheme = () => {
  const isDark = useThemeStore((state) => state.isDark);
  const colors = getThemedColors(isDark);
  return { isDark, colors };
};

export const useThemeToggle = () => {
  const toggleTheme = useThemeStore((state) => state.toggleTheme);
  const setDarkMode = useThemeStore((state) => state.setDarkMode);
  return { toggleTheme, setDarkMode };
};
