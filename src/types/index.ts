export interface Expense {
  id: string;
  amount: number;
  description: string;
  category: CategoryType;
  expenseDate: string; // YYYY-MM-DD format
  createdAt: string;   // ISO 8601
  updatedAt: string;   // ISO 8601
}

export interface Budget {
  id: string;
  periodType: 'weekly';
  startDate: string;  // YYYY-MM-DD
  endDate: string;    // YYYY-MM-DD
  totalLimit: number;
  status: 'active' | 'archived' | 'draft';
  createdAt: string;
}

export interface BudgetCategory {
  id: string;
  budgetId: string;
  category: CategoryType;
  limitAmount: number;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string; // YYYY-MM format
  createdAt: string;
}

export interface RecurringExpense {
  id: string;
  description: string;
  amount: number;
  category: CategoryType;
  frequency: 'weekly' | 'monthly';
  nextExpectedDate: string; // YYYY-MM-DD
  active: boolean; // stored as 0 or 1 in SQLite, mapped to boolean in TS
}

export const CATEGORIES = [
  'Food',
  'Transport',
  'Shopping',
  'Bills',
  'Entertainment',
  'Health',
  'Education',
  'Travel',
  'Other'
] as const;

export type CategoryType = typeof CATEGORIES[number];

export interface OnboardingData {
  currency: string;
  monthlyIncome?: number;
  monthlySavingsGoal?: number;
}
