import { describe, test, expect } from '@jest/globals';
import { calculateMoneyHealthScore } from '../moneyHealth';

describe('Money Health Scoring Engine', () => {

  test('calculateMoneyHealthScore should return a high rating for disciplined budgets', () => {
    // 0 overspend, hit savings goal, stable spending, low commitments
    const result = calculateMoneyHealthScore({
      weeklyLimit: 400,
      spentThisWeek: 200, // 50% spent
      monthlyIncome: 3000,
      monthlySavingsTarget: 500,
      actualSavedThisMonth: 500, // 100% saved
      dailySpendingHistory: [30, 28, 32, 29, 31], // very low variance
      totalMonthlyRecurring: 300, // 10% commitments
    });

    expect(result.score).toBeGreaterThanOrEqual(85);
    expect(result.rating).toBe('Excellent');
  });

  test('calculateMoneyHealthScore should return poor standings for overspent budgets', () => {
    // Exceeded weekly budget, missed savings goals, high recurring bills
    const result = calculateMoneyHealthScore({
      weeklyLimit: 400,
      spentThisWeek: 650, // Exceeded by > 50% -> Budget Adherence score = 0
      monthlyIncome: 2000,
      monthlySavingsTarget: 400,
      actualSavedThisMonth: 50, // under target
      dailySpendingHistory: [100, 20, 450, 80], // high variance
      totalMonthlyRecurring: 1200, // 60% commitments -> exceeds 40% threshold
    });

    expect(result.score).toBeLessThan(50);
    expect(result.rating).toBe('Poor');
  });

});
