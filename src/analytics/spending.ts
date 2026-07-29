import { Expense, CategoryType, CATEGORIES } from '@/types';

export interface SpendingComparison {
  category: CategoryType;
  currentAmount: number;
  previousAmount: number;
  percentageChange: number; // Percentage change (e.g. 32.5 representing +32.5%, or -15 representing -15%)
}

/**
 * Calculates sum of expense amounts.
 */
export function calculateTotalSpent(expenses: Expense[]): number {
  return expenses.reduce((sum, item) => sum + item.amount, 0);
}

/**
 * Groups expenses by category and returns the total spent in each.
 */
export function getCategoryTotals(expenses: Expense[]): Record<CategoryType, number> {
  const totals = {} as Record<CategoryType, number>;
  
  // Initialize all categories to 0
  for (const cat of CATEGORIES) {
    totals[cat] = 0;
  }

  for (const exp of expenses) {
    totals[exp.category] = (totals[exp.category] || 0) + exp.amount;
  }

  return totals;
}

/**
 * Calculates category spending percentages based on total spent.
 */
export function getCategoryPercentages(expenses: Record<CategoryType, number>, totalSpent: number): Record<CategoryType, number> {
  const percentages = {} as Record<CategoryType, number>;
  
  for (const cat of CATEGORIES) {
    percentages[cat] = 0;
  }

  if (totalSpent <= 0) return percentages;

  for (const cat of CATEGORIES) {
    percentages[cat] = Math.round((expenses[cat] / totalSpent) * 100);
  }

  return percentages;
}

/**
 * Groups expenses by date and returns date -> total spent map.
 */
export function getDailySpending(expenses: Expense[]): Record<string, number> {
  const daily: Record<string, number> = {};
  
  for (const exp of expenses) {
    const date = exp.expenseDate;
    daily[date] = (daily[date] || 0) + exp.amount;
  }

  return daily;
}

/**
 * Calculates average daily spending based on active days count.
 */
export function getAverageDailySpending(expenses: Expense[], daysCount: number): number {
  if (daysCount <= 0) return 0;
  const total = calculateTotalSpent(expenses);
  return parseFloat((total / daysCount).toFixed(2));
}

/**
 * Pattern Engine: Detects small purchases (micro-transactions).
 * E.g., multiple transactions below a specified threshold (default $10).
 */
export function detectSmallPurchases(expenses: Expense[], threshold: number = 10): { count: number; total: number } {
  const smallItems = expenses.filter(exp => exp.amount < threshold);
  const total = smallItems.reduce((sum, item) => sum + item.amount, 0);
  
  return {
    count: smallItems.length,
    total: parseFloat(total.toFixed(2)),
  };
}

/**
 * Pattern Engine: Compares spending by category between two distinct periods (e.g. this week vs last week).
 */
export function compareSpending(current: Expense[], previous: Expense[]): SpendingComparison[] {
  const currentTotals = getCategoryTotals(current);
  const previousTotals = getCategoryTotals(previous);
  const comparisons: SpendingComparison[] = [];

  for (const cat of CATEGORIES) {
    const curAmt = currentTotals[cat] || 0;
    const prevAmt = previousTotals[cat] || 0;
    
    let pctChange = 0;
    if (prevAmt > 0) {
      pctChange = parseFloat((((curAmt - prevAmt) / prevAmt) * 100).toFixed(2));
    } else if (curAmt > 0) {
      pctChange = 100; // 100% increase if there was no previous spend
    }

    // Only report comparisons where there was spending in at least one period
    if (curAmt > 0 || prevAmt > 0) {
      comparisons.push({
        category: cat,
        currentAmount: curAmt,
        previousAmount: prevAmt,
        percentageChange: pctChange,
      });
    }
  }

  return comparisons.sort((a, b) => b.percentageChange - a.percentageChange);
}

/**
 * Pattern Engine: Detects anomalous spending spikes in category sums.
 * Spikes are defined as exceeding the historical average by a factor (e.g., > 1.5x average).
 */
export function detectUnusualCategorySpending(
  currentExpenses: Expense[],
  historicalAverages: Partial<Record<CategoryType, number>>,
  thresholdFactor: number = 1.5
): string[] {
  const currentTotals = getCategoryTotals(currentExpenses);
  const alerts: string[] = [];

  for (const [catStr, avg] of Object.entries(historicalAverages)) {
    const cat = catStr as CategoryType;
    const currentAmount = currentTotals[cat] || 0;
    
    if (avg && avg > 0 && currentAmount > (avg * thresholdFactor)) {
      alerts.push(
        `You normally spend around $${avg.toFixed(0)}/week on ${cat.toLowerCase()}. This week you've spent $${currentAmount.toFixed(0)}.`
      );
    }
  }

  return alerts;
}
