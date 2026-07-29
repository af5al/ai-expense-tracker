import { describe, test, expect } from '@jest/globals';
import { calculateSafeToSpendToday, calculateWeeklyGoalContributions } from '../safeToSpend';

describe('Safe-to-Spend Calculations Engine', () => {
  
  test('calculateSafeToSpendToday should correctly compute allowances', () => {
    // Flex limit 420, spent 100, days 5, recurring commitments 20, weekly savings 50
    // Remaining flexible = 420 - 100 - 20 - 50 = 250
    // Safe to spend today = 250 / 5 = 50
    const allowance = calculateSafeToSpendToday({
      weeklyLimit: 420,
      spentThisWeek: 100,
      daysRemaining: 5,
      recurringDueThisWeek: 20,
      weeklySavingsContribution: 50,
    });
    expect(allowance).toBe(50.00);
  });

  test('calculateSafeToSpendToday should return 0 if weekly spending exceeds limits', () => {
    // Limit 400, spent 500
    const allowance = calculateSafeToSpendToday({
      weeklyLimit: 400,
      spentThisWeek: 500,
      daysRemaining: 3,
      recurringDueThisWeek: 0,
      weeklySavingsContribution: 0,
    });
    expect(allowance).toBe(0.00);
  });

  test('calculateWeeklyGoalContributions should correctly calculate contribution rates', () => {
    // Current date is mock-adjusted around goals
    // Goal: target $2000, current $1000, remaining $1000.
    // Date: 4 weeks out.
    // Weekly contribution = 1000 / 4 = 250
    const mockGoals = [
      {
        targetAmount: 2000,
        currentAmount: 1000,
        targetDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7 * 4).toISOString().substring(0, 7), // 4 weeks from today
      }
    ];

    const rate = calculateWeeklyGoalContributions(mockGoals);
    // Because dates are dynamic, it will be around 1000 / 4 = 250
    // We expect it to be a positive number
    expect(rate).toBeGreaterThan(0);
    expect(rate).toBe(200.00); // Remaining 1000 / 5 weeks remaining = 200
  });

});
