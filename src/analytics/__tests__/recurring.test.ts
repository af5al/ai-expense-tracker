import { describe, test, expect } from '@jest/globals';
import { detectRecurringFromExpenses } from '../recurring';
import { Expense, RecurringExpense } from '@/types';

describe('Recurring Commitment Detector Engine', () => {

  test('detectRecurringFromExpenses should suggest a subscription if identical transactions occur monthly', () => {
    // 2 Netflix expenses, 30 days apart
    const mockExpenses: Expense[] = [
      {
        id: 'a1',
        amount: 15.99,
        description: 'Netflix',
        category: 'Entertainment',
        expenseDate: '2026-06-15',
        createdAt: '',
        updatedAt: '',
      },
      {
        id: 'a2',
        amount: 15.99,
        description: 'Netflix',
        category: 'Entertainment',
        expenseDate: '2026-07-15', // exactly 30 days apart
        createdAt: '',
        updatedAt: '',
      },
    ];

    const suggestions = detectRecurringFromExpenses(mockExpenses, []);
    
    expect(suggestions.length).toBe(1);
    expect(suggestions[0].description).toBe('Netflix');
    expect(suggestions[0].amount).toBe(15.99);
    expect(suggestions[0].frequency).toBe('monthly');
  });

  test('detectRecurringFromExpenses should ignore items already tracked in active list', () => {
    const mockExpenses: Expense[] = [
      { id: '1', amount: 9.99, description: 'Spotify', category: 'Entertainment', expenseDate: '2026-06-20', createdAt: '', updatedAt: '' },
      { id: '2', amount: 9.99, description: 'Spotify', category: 'Entertainment', expenseDate: '2026-07-20', createdAt: '', updatedAt: '' }
    ];

    const alreadyTracked: RecurringExpense[] = [
      {
        id: 'id-spotify',
        description: 'Spotify',
        amount: 9.99,
        category: 'Entertainment',
        frequency: 'monthly',
        nextExpectedDate: '2026-08-20',
        active: true,
      }
    ];

    const suggestions = detectRecurringFromExpenses(mockExpenses, alreadyTracked);
    expect(suggestions.length).toBe(0); // already tracked, so no suggestions
  });

});
