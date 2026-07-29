import { Expense, RecurringExpense, CategoryType } from '@/types';

export interface RecurringSuggestion {
  description: string;
  amount: number;
  category: CategoryType;
  frequency: 'weekly' | 'monthly';
  nextExpectedDate: string;
}

/**
 * Parses historical transaction arrays locally to detect potential weekly/monthly subscriptions.
 * Excludes entries that are already in our tracked lists.
 */
export function detectRecurringFromExpenses(
  expenses: Expense[],
  alreadyTracked: RecurringExpense[]
): RecurringSuggestion[] {
  const suggestions: RecurringSuggestion[] = [];
  
  // Group expenses by a clean description and exact amount
  // Key: "description_amount"
  const groups: Record<string, Expense[]> = {};
  
  for (const exp of expenses) {
    const cleanDesc = exp.description.toLowerCase().trim();
    const key = `${cleanDesc}_${exp.amount.toFixed(2)}`;
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(exp);
  }

  // Filter groups with at least 2 entries to check intervals
  for (const [key, items] of Object.entries(groups)) {
    if (items.length < 2) continue;

    // Sort items by date ascending
    const sorted = [...items].sort((a, b) => a.expenseDate.localeCompare(b.expenseDate));
    
    // Calculate daily intervals between consecutive transactions
    const intervals: number[] = [];
    for (let i = 0; i < sorted.length - 1; i++) {
      const d1 = new Date(sorted[i].expenseDate + 'T00:00:00');
      const d2 = new Date(sorted[i + 1].expenseDate + 'T00:00:00');
      const diffMs = d2.getTime() - d1.getTime();
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
      intervals.push(diffDays);
    }

    // Evaluate interval consistency
    const isMonthly = intervals.every(days => days >= 25 && days <= 32);
    const isWeekly = intervals.every(days => days >= 6 && days <= 8);

    if (isMonthly || isWeekly) {
      const sampleItem = sorted[0];
      const name = sampleItem.description;
      const cleanNameLower = name.toLowerCase().trim();

      // Check if this subscription is already listed in the database
      const alreadyExists = alreadyTracked.some(
        track => track.description.toLowerCase().trim() === cleanNameLower
      );

      if (!alreadyExists) {
        // Calculate the next expected billing date
        const lastDate = new Date(sorted[sorted.length - 1].expenseDate + 'T00:00:00');
        const nextDate = new Date(lastDate);
        
        if (isMonthly) {
          nextDate.setMonth(nextDate.getMonth() + 1);
        } else {
          nextDate.setDate(nextDate.getDate() + 7);
        }

        suggestions.push({
          description: name,
          amount: sampleItem.amount,
          category: sampleItem.category,
          frequency: isMonthly ? 'monthly' : 'weekly',
          nextExpectedDate: nextDate.toISOString().split('T')[0],
        });
      }
    }
  }

  return suggestions;
}
