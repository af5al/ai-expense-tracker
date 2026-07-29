export interface SafeToSpendParams {
  weeklyLimit: number;
  spentThisWeek: number;
  daysRemaining: number; // Values from 1 to 7
  recurringDueThisWeek: number; // Prorated or direct recurring commitments due this week
  weeklySavingsContribution: number; // Sum of contributions for active goals
}

/**
 * Calculates the Safe-to-Spend daily allowance.
 * Formula: SafeToSpendToday = Max(0, (WeeklyLimit - SpentThisWeek - RecurringDue - Savings) / DaysRemaining)
 */
export function calculateSafeToSpendToday(params: SafeToSpendParams): number {
  const {
    weeklyLimit,
    spentThisWeek,
    daysRemaining,
    recurringDueThisWeek,
    weeklySavingsContribution,
  } = params;

  // Prevent division by zero or negative days remaining
  const days = Math.max(1, daysRemaining);

  // Compute remaining flexible cash
  const remainingCash = weeklyLimit - spentThisWeek - recurringDueThisWeek - weeklySavingsContribution;

  // Bounded below by 0
  const safeAllowance = remainingCash / days;
  return Math.max(0, parseFloat(safeAllowance.toFixed(2)));
}

/**
 * Calculates weekly savings contribution required to hit goals.
 * Target contributions are remaining goals targets divided by remaining weeks to target dates.
 */
export function calculateWeeklyGoalContributions(
  goals: { targetAmount: number; currentAmount: number; targetDate: string }[] // targetDate in YYYY-MM
): number {
  const today = new Date();
  let totalWeeklyContribution = 0;

  for (const goal of goals) {
    const remainingTarget = goal.targetAmount - goal.currentAmount;
    if (remainingTarget <= 0) continue;

    // Parse target date (YYYY-MM)
    const [year, month] = goal.targetDate.split('-').map(Number);
    const targetDate = new Date(year, month - 1, 28); // end of target month
    
    const diffMs = targetDate.getTime() - today.getTime();
    const diffWeeks = diffMs / (1000 * 60 * 60 * 24 * 7);
    
    const weeksRemaining = Math.max(1, Math.ceil(diffWeeks));
    const weeklyRate = remainingTarget / weeksRemaining;

    totalWeeklyContribution += weeklyRate;
  }

  return parseFloat(totalWeeklyContribution.toFixed(2));
}
