import { create } from 'zustand';
import { getSetting, setSetting } from '@/database/settingsService';

interface SettingsState {
  currency: string;
  monthlyIncome: number;
  monthlySavingsGoal: number;
  onboardingCompleted: boolean;
  theme: 'light' | 'dark' | 'system';
  isLoading: boolean;
  
  // Actions
  loadSettings: () => Promise<void>;
  setCurrency: (currency: string) => Promise<void>;
  setMonthlyIncome: (income: number) => Promise<void>;
  setMonthlySavingsGoal: (goal: number) => Promise<void>;
  setOnboardingCompleted: (completed: boolean) => Promise<void>;
  setTheme: (theme: 'light' | 'dark' | 'system') => Promise<void>;
  resetAllSettings: () => void;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  currency: '$',
  monthlyIncome: 0,
  monthlySavingsGoal: 0,
  onboardingCompleted: false,
  theme: 'system',
  isLoading: true,

  loadSettings: async () => {
    try {
      const currency = await getSetting('currency', '$');
      const monthlyIncome = parseFloat(await getSetting('monthlyIncome', '0'));
      const monthlySavingsGoal = parseFloat(await getSetting('monthlySavingsGoal', '0'));
      const onboardingCompleted = (await getSetting('onboardingCompleted', 'false')) === 'true';
      const theme = (await getSetting('theme', 'system')) as 'light' | 'dark' | 'system';

      set({
        currency,
        monthlyIncome,
        monthlySavingsGoal,
        onboardingCompleted,
        theme,
        isLoading: false,
      });
    } catch (e) {
      console.error('[SettingsStore] Error loading settings:', e);
      set({ isLoading: false });
    }
  },

  setCurrency: async (currency) => {
    await setSetting('currency', currency);
    set({ currency });
  },

  setMonthlyIncome: async (income) => {
    await setSetting('monthlyIncome', income.toString());
    set({ monthlyIncome: income });
  },

  setMonthlySavingsGoal: async (goal) => {
    await setSetting('monthlySavingsGoal', goal.toString());
    set({ monthlySavingsGoal: goal });
  },

  setOnboardingCompleted: async (completed) => {
    await setSetting('onboardingCompleted', completed ? 'true' : 'false');
    set({ onboardingCompleted: completed });
  },

  setTheme: async (theme) => {
    await setSetting('theme', theme);
    set({ theme });
  },

  resetAllSettings: () => {
    set({
      currency: '$',
      monthlyIncome: 0,
      monthlySavingsGoal: 0,
      onboardingCompleted: false,
      theme: 'system',
    });
  }
}));
