import { describe, test, expect } from '@jest/globals';
import { Expense } from '@/types';
import {
  calculateTotalSpent,
  getCategoryTotals,
  getCategoryPercentages,
  getDailySpending,
  getAverageDailySpending,
  detectSmallPurchases,
  compareSpending,
  detectUnusualCategorySpending,
} from '../spending';

// Mock expense list representing typical ledger rows
const mockExpenses: Expense[] = [
  {
    id: '1',
    amount: 10.00,
    description: 'Starbucks Coffee',
    category: 'Food',
    expenseDate: '2026-07-29',
    createdAt: '2026-07-29T10:00:00Z',
    updatedAt: '2026-07-29T10:00:00Z',
  },
  {
    id: '2',
    amount: 35.00,
    description: 'Gas station fuel',
    category: 'Transport',
    expenseDate: '2026-07-29',
    createdAt: '2026-07-29T11:00:00Z',
    updatedAt: '2026-07-29T11:00:00Z',
  },
  {
    id: '3',
    amount: 8.50,
    description: 'City bus ticket',
    category: 'Transport',
    expenseDate: '2026-07-28',
    createdAt: '2026-07-28T09:00:00Z',
    updatedAt: '2026-07-28T09:00:00Z',
  },
  {
    id: '4',
    amount: 45.00,
    description: 'Trader Joe groceries',
    category: 'Food',
    expenseDate: '2026-07-27',
    createdAt: '2026-07-27T14:00:00Z',
    updatedAt: '2026-07-27T14:00:00Z',
  },
  {
    id: '5',
    amount: 4.50,
    description: 'Chips snack',
    category: 'Food',
    expenseDate: '2026-07-27',
    createdAt: '2026-07-27T15:00:00Z',
    updatedAt: '2026-07-27T15:00:00Z',
  },
];

describe('Spending Analytics Engine', () => {
  
  test('calculateTotalSpent should correctly sum all transaction amounts', () => {
    const total = calculateTotalSpent(mockExpenses);
    expect(total).toBe(103.00); // 10 + 35 + 8.5 + 45 + 4.5
  });

  test('getCategoryTotals should aggregate expenses by category accurately', () => {
    const totals = getCategoryTotals(mockExpenses);
    expect(totals['Food']).toBe(59.50);      // 10 + 45 + 4.5
    expect(totals['Transport']).toBe(43.50); // 35 + 8.5
    expect(totals['Shopping']).toBe(0.00);   // Untouched category
  });

  test('getCategoryPercentages should compute correct rounded integers', () => {
    const totals = getCategoryTotals(mockExpenses);
    const percentages = getCategoryPercentages(totals, 103.00);
    
    // Food = 59.50 / 103 ≈ 58%
    expect(percentages['Food']).toBe(58);
    // Transport = 43.50 / 103 ≈ 42%
    expect(percentages['Transport']).toBe(42);
    expect(percentages['Shopping']).toBe(0);
  });

  test('getDailySpending should group transaction values by date key', () => {
    const daily = getDailySpending(mockExpenses);
    expect(daily['2026-07-29']).toBe(45.00); // 10 + 35
    expect(daily['2026-07-28']).toBe(8.50);  // 8.50
    expect(daily['2026-07-27']).toBe(49.50); // 45 + 4.5
  });

  test('getAverageDailySpending should compute correct averages', () => {
    const avg = getAverageDailySpending(mockExpenses, 3);
    expect(avg).toBe(34.33); // 103 / 3 = 34.333...
    
    const zeroDaysAvg = getAverageDailySpending(mockExpenses, 0);
    expect(zeroDaysAvg).toBe(0);
  });

  test('detectSmallPurchases should identify items under target threshold', () => {
    // Under default threshold of $10: Coffee ($10 is not under), Bus ($8.50), Chips ($4.50)
    const { count, total } = detectSmallPurchases(mockExpenses, 10);
    expect(count).toBe(2);
    expect(total).toBe(13.00); // 8.50 + 4.50
  });

  test('compareSpending should detect correct percentage changes between weeks', () => {
    const currentWeek: Expense[] = [
      { id: 'a', amount: 100.00, description: 'Supermarket', category: 'Food', expenseDate: '2026-07-29', createdAt: '', updatedAt: '' },
      { id: 'b', amount: 40.00, description: 'Gas station', category: 'Transport', expenseDate: '2026-07-28', createdAt: '', updatedAt: '' }
    ];

    const previousWeek: Expense[] = [
      { id: 'c', amount: 50.00, description: 'Diner', category: 'Food', expenseDate: '2026-07-22', createdAt: '', updatedAt: '' },
      { id: 'd', amount: 40.00, description: 'Bus pass', category: 'Transport', expenseDate: '2026-07-21', createdAt: '', updatedAt: '' }
    ];

    const comparisons = compareSpending(currentWeek, previousWeek);

    // Food spending doubled: (100 - 50) / 50 = +100%
    const foodComp = comparisons.find(c => c.category === 'Food');
    expect(foodComp).toBeDefined();
    expect(foodComp?.percentageChange).toBe(100);

    // Transport spending remained unchanged: (40 - 40) / 40 = 0%
    const transComp = comparisons.find(c => c.category === 'Transport');
    expect(transComp).toBeDefined();
    expect(transComp?.percentageChange).toBe(0);
  });

  test('detectUnusualCategorySpending should flag categories exceeding average threshold', () => {
    // Current spent: Food: $59.50, Transport: $43.50
    // Historical weekly averages: Food average: $30, Transport average: $40
    const historicalAverages = {
      Food: 30.00,       // $59.50 is > 1.5 * $30 ($45). Alert should trigger.
      Transport: 40.00,  // $43.50 is NOT > 1.5 * $40 ($60). No alert.
    };

    const alerts = detectUnusualCategorySpending(mockExpenses, historicalAverages, 1.5);
    
    expect(alerts.length).toBe(1);
    expect(alerts[0].toLowerCase()).toContain('food');
    expect(alerts[0]).not.toContain('Transport');
  });

});
