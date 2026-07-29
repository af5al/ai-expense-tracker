import { queryOne, execute } from './db';

/**
 * Get a setting from the local settings database table.
 */
export function getSetting(key: string, defaultValue: string): string {
  try {
    const row = queryOne<{ value: string }>('SELECT value FROM settings WHERE key = ?', [key]);
    return row ? row.value : defaultValue;
  } catch (error) {
    console.warn(`[SettingsService] Failed to get setting "${key}", using default.`, error);
    return defaultValue;
  }
}

/**
 * Insert or replace a setting in the local settings database table.
 */
export function setSetting(key: string, value: string): void {
  try {
    execute('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [key, value]);
  } catch (error) {
    console.error(`[SettingsService] Failed to save setting "${key}":`, error);
  }
}
