interface MoneyHealthParams {
  weeklyLimit: number;
  spentThisWeek: number;
  monthlyIncome: number;
  monthlySavingsTarget: number;
  actualSavedThisMonth: number;
  dailySpendingHistory: number[]; // Array of spent amounts for recent days
  totalMonthlyRecurring: number;
}

interface MoneyHealthResult {
  score: number; // 0 - 100
  rating: 'Excellent' | 'Good' | 'Average' | 'Poor';
  breakdown: {
    budget: number;      // 0 - 100
    savings: number;     // 0 - 100
    consistency: number; // 0 - 100
    commitments: number; // 0 - 100
  };
  explanation: string;
}

/**
 * Helper to compute standard deviation of an array.
 */
function getStandardDeviation(arr: number[]): { mean: number; stdDev: number } {
  const n = arr.length;
  if (n === 0) return { mean: 0, stdDev: 0 };
  
  const mean = arr.reduce((sum, val) => sum + val, 0) / n;
  if (n === 1) return { mean, stdDev: 0 };

  const variance = arr.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (n - 1);
  return { mean, stdDev: Math.sqrt(variance) };
}

/**
 * Calculates a Money Health Score from 0 to 100 based on local rules.
 */
export function calculateMoneyHealthScore(params: MoneyHealthParams): MoneyHealthResult {
  const {
    weeklyLimit,
    spentThisWeek,
    monthlyIncome,
    monthlySavingsTarget,
    actualSavedThisMonth,
    dailySpendingHistory,
    totalMonthlyRecurring,
  } = params;

  // 1. Budget Adherence (40% Weight)
  let budgetScore = 100;
  if (weeklyLimit > 0) {
    const ratio = spentThisWeek / weeklyLimit;
    if (ratio > 1.5) {
      budgetScore = 0;
    } else if (ratio > 1.0) {
      budgetScore = Math.max(0, Math.round(100 - (ratio - 1.0) * 200));
    }
  }

  // 2. Savings Goal Progress (30% Weight)
  let savingsScore = 100;
  if (monthlySavingsTarget > 0) {
    const ratio = actualSavedThisMonth / monthlySavingsTarget;
    savingsScore = Math.min(100, Math.round(ratio * 100));
  }

  // 3. Spending Consistency / Variance (20% Weight)
  let consistencyScore = 100;
  if (dailySpendingHistory.length > 1) {
    const { mean, stdDev } = getStandardDeviation(dailySpendingHistory);
    if (mean > 0) {
      const cv = stdDev / mean; // Coefficient of Variation
      consistencyScore = Math.max(0, Math.round(100 - Math.min(100, cv * 50)));
    }
  }

  // 4. Recurring Commitments Burden (10% Weight)
  let commitmentsScore = 100;
  if (monthlyIncome > 0) {
    const ratio = totalMonthlyRecurring / monthlyIncome;
    if (ratio > 0.40) {
      commitmentsScore = Math.max(0, Math.round(100 - (ratio - 0.40) * 200));
    }
  }

  // Combine weighted components
  const weightedScore = (
    budgetScore * 0.40 +
    savingsScore * 0.30 +
    consistencyScore * 0.20 +
    commitmentsScore * 0.10
  );

  const finalScore = Math.min(100, Math.max(0, Math.round(weightedScore)));

  // Ratings classifications
  let rating: 'Excellent' | 'Good' | 'Average' | 'Poor' = 'Average';
  let explanation = '';

  if (finalScore >= 85) {
    rating = 'Excellent';
    explanation = 'Outstanding! You are adhering to your limits, saving diligently, and fixed burdens are low.';
  } else if (finalScore >= 70) {
    rating = 'Good';
    explanation = 'Good job! Your expenses are stable, though category overspends or target delays limit peak performance.';
  } else if (finalScore >= 50) {
    rating = 'Average';
    explanation = 'Average standings. Review flexible items and ensure fixed bills do not crowd out savings goals.';
  } else {
    rating = 'Poor';
    explanation = 'Caution: Budget limits exceeded or savings goals are neglected. Budget adjustments recommended.';
  }

  return {
    score: finalScore,
    rating,
    breakdown: {
      budget: budgetScore,
      savings: savingsScore,
      consistency: consistencyScore,
      commitments: commitmentsScore,
    },
    explanation,
  };
}
