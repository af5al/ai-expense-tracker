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
  loadSettings: () => void;
  setCurrency: (currency: string) => void;
  setMonthlyIncome: (income: number) => void;
  setMonthlySavingsGoal: (goal: number) => void;
  setOnboardingCompleted: (completed: boolean) => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  resetAllSettings: () => void;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  currency: '$',
  monthlyIncome: 0,
  monthlySavingsGoal: 0,
  onboardingCompleted: false,
  theme: 'system',
  isLoading: true,

  loadSettings: () => {
    try {
      const currency = getSetting('currency', '$');
      const monthlyIncome = parseFloat(getSetting('monthlyIncome', '0'));
      const monthlySavingsGoal = parseFloat(getSetting('monthlySavingsGoal', '0'));
      const onboardingCompleted = getSetting('onboardingCompleted', 'false') === 'true';
      const theme = getSetting('theme', 'system') as 'light' | 'dark' | 'system';

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

  setCurrency: (currency) => {
    setSetting('currency', currency);
    set({ currency });
  },

  setMonthlyIncome: (income) => {
    setSetting('monthlyIncome', income.toString());
    set({ monthlyIncome: income });
  },

  setMonthlySavingsGoal: (goal) => {
    setSetting('monthlySavingsGoal', goal.toString());
    set({ monthlySavingsGoal: goal });
  },

  setOnboardingCompleted: (completed) => {
    setSetting('onboardingCompleted', completed ? 'true' : 'false');
    set({ onboardingCompleted: completed });
  },

  setTheme: (theme) => {
    setSetting('theme', theme);
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
