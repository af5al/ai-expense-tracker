import { useColorScheme } from 'react-native';
import { Colors } from '@/constants/theme';
import { useSettingsStore } from '@/stores/settingsStore';

/**
 * Custom hook to retrieve the current theme's color values.
 * Respects user preferences in settings (light, dark, or system scheme).
 */
export function useTheme() {
  const systemScheme = useColorScheme();
  const themeSetting = useSettingsStore((state) => state.theme);

  const activeScheme = themeSetting === 'system' ? (systemScheme || 'light') : themeSetting;
  return Colors[activeScheme === 'dark' ? 'dark' : 'light'];
}
