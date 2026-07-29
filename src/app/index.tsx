import { StyleSheet, View, ScrollView, Pressable } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing, CornerRadius, BottomTabInset } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useSettingsStore } from '@/stores/settingsStore';
import { getSpentToday, getSpentThisWeek, getSpentTodayByCategory } from '@/database/expenseService';
import { getGoals } from '@/database/goalsService';
import { getRecurringExpenses } from '@/database/recurringService';
import { calculateWeeklyGoalContributions, calculateSafeToSpendToday } from '@/analytics/safeToSpend';
import { CategoryType, RecurringExpense } from '@/types';

const CATEGORY_ICONS: Record<CategoryType, string> = {
  Food: 'fast-food',
  Transport: 'car',
  Shopping: 'cart',
  Bills: 'document-text',
  Entertainment: 'film',
  Health: 'heart',
  Education: 'book',
  Travel: 'airplane',
  Other: 'cash',
};

export default function HomeScreen() {
  const router = useRouter();
  const theme = useTheme();
  
  // Settings Store values
  const { currency, monthlyIncome, monthlySavingsGoal, onboardingCompleted } = useSettingsStore();

  // Dynamic Dashboard States
  const [spentToday, setSpentToday] = useState(0);
  const [spentThisWeek, setSpentThisWeek] = useState(0);
  const [todayCategories, setTodayCategories] = useState<{ category: CategoryType; total: number }[]>([]);
  const [weeklySavingsContribution, setWeeklySavingsContribution] = useState(0);
  const [recurringDueThisWeek, setRecurringDueThisWeek] = useState(0);

  // Calculate default budget limit: (Income - Savings Goal) / 4.33
  // If income is zero, default to a standard limit of 400
  const monthlyFlexible = Math.max(0, monthlyIncome - monthlySavingsGoal);
  const weeklyLimit = monthlyIncome > 0 ? Math.round(monthlyFlexible / 4.33) : 400;

  // Calculate remaining days in the budget week (starting Monday)
  const getDaysRemaining = (): number => {
    const day = new Date().getDay(); // 0 is Sunday, 1 is Monday, ..., 6 is Saturday
    const mondayBasedDay = day === 0 ? 7 : day;
    return 8 - mondayBasedDay; // e.g. Monday has 7 days left, Sunday has 1 day left
  };

  const daysRemaining = getDaysRemaining();

  // Helper to determine recurring bills due during the remaining days of this week
  const getRecurringDueThisWeekAmount = (bills: RecurringExpense[]): number => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? 0 : 7); // Next Sunday
    const sunday = new Date(today);
    sunday.setDate(diff);
    sunday.setHours(23, 59, 59, 999);

    let sum = 0;
    for (const bill of bills) {
      if (!bill.active) continue;
      try {
        const nextDate = new Date(bill.nextExpectedDate + 'T00:00:00');
        if (nextDate >= today && nextDate <= sunday) {
          sum += bill.amount;
        }
      } catch (e) {
        // ignore invalid dates
      }
    }
    return sum;
  };

  // Safe to Spend Today calculations
  const safeToSpendToday = Math.round(
    calculateSafeToSpendToday({
      weeklyLimit,
      spentThisWeek,
      daysRemaining,
      recurringDueThisWeek,
      weeklySavingsContribution,
    })
  );

  const remainingWeeklyBudget = Math.max(
    0,
    weeklyLimit - spentThisWeek - recurringDueThisWeek - weeklySavingsContribution
  );

  const refreshDashboard = useCallback(() => {
    try {
      // 1. Fetch spending aggregates
      const todayTotal = getSpentToday();
      const weekTotal = getSpentThisWeek();
      const todayCats = getSpentTodayByCategory();

      setSpentToday(todayTotal);
      setSpentThisWeek(weekTotal);
      setTodayCategories(todayCats);

      // 2. Fetch active savings goals and calculate weekly rates
      const activeGoals = getGoals();
      const weeklySavings = calculateWeeklyGoalContributions(activeGoals);
      setWeeklySavingsContribution(weeklySavings);

      // 3. Fetch active recurring bills and sum those due this week
      const bills = getRecurringExpenses(true);
      const billsDue = getRecurringDueThisWeekAmount(bills);
      setRecurringDueThisWeek(billsDue);

    } catch (error) {
      console.error('[Dashboard] Failed to refresh aggregates:', error);
    }
  }, []);

  // Refresh data every time the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      refreshDashboard();
    }, [refreshDashboard])
  );

  const totalWeeklyDeduction = spentThisWeek + recurringDueThisWeek + weeklySavingsContribution;
  const progressPercent = weeklyLimit > 0 ? Math.min(100, (totalWeeklyDeduction / weeklyLimit) * 100) : 0;

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Onboarding Banner if not completed */}
        {!onboardingCompleted && (
          <Pressable onPress={() => router.push('/settings')} style={[styles.onboardingBanner, { backgroundColor: theme.primaryLight }]}>
            <View style={styles.onboardingTextContainer}>
              <ThemedText style={[styles.bannerTitle, { color: theme.primary }]}>Welcome! Let's get set up</ThemedText>
              <ThemedText style={[styles.bannerBody, { color: theme.textSecondary }]}>
                Configure your preferred currency, income, and monthly savings target.
              </ThemedText>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.primary} />
          </Pressable>
        )}

        {/* Header Title */}
        <View style={styles.header}>
          <View>
            <ThemedText type="small" themeColor="textSecondary">Welcome back</ThemedText>
            <ThemedText type="subtitle" style={styles.greetingText}>Dashboard</ThemedText>
          </View>
          <Pressable 
            onPress={() => router.push('/settings')} 
            style={[styles.settingsButton, { backgroundColor: theme.card, borderColor: theme.border }]}
          >
            <Ionicons name="settings-outline" size={20} color={theme.text} />
          </Pressable>
        </View>

        {/* Safe to Spend Section */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <ThemedText type="small" themeColor="textSecondary" style={styles.cardSubtitle}>
            SAFE TO SPEND TODAY
          </ThemedText>
          <ThemedText style={[styles.largeAmount, { color: safeToSpendToday > 0 ? theme.success : theme.danger }]}>
            {currency}{safeToSpendToday}
          </ThemedText>
          <ThemedText style={styles.cardExplanation} type="small" themeColor="textSecondary">
            Based on {currency}{remainingWeeklyBudget.toFixed(0)} remaining flexible budget and {daysRemaining} days left in your cycle.
          </ThemedText>
        </View>

        {/* Weekly Budget Progress Card */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <ThemedText type="small" themeColor="textSecondary" style={styles.cardSubtitle}>
            THIS WEEK'S BUDGET SUMMARY
          </ThemedText>
          
          <View style={styles.budgetMetricsGrid}>
            <View style={styles.metricItem}>
              <ThemedText type="small" themeColor="textSecondary">Spent</ThemedText>
              <ThemedText style={styles.metricVal}>{currency}{spentThisWeek.toFixed(0)}</ThemedText>
            </View>
            <View style={styles.metricItem}>
              <ThemedText type="small" themeColor="textSecondary">Goals</ThemedText>
              <ThemedText style={styles.metricVal}>{currency}{weeklySavingsContribution.toFixed(0)}</ThemedText>
            </View>
            <View style={styles.metricItem}>
              <ThemedText type="small" themeColor="textSecondary">Bills Due</ThemedText>
              <ThemedText style={styles.metricVal}>{currency}{recurringDueThisWeek.toFixed(0)}</ThemedText>
            </View>
          </View>

          <View style={styles.budgetRow}>
            <ThemedText style={styles.budgetMain}>
              Used {currency}{totalWeeklyDeduction.toFixed(0)} of {currency}{weeklyLimit}
            </ThemedText>
            <ThemedText style={[styles.budgetRemaining, { color: theme.primary }]}>
              {currency}{remainingWeeklyBudget.toFixed(0)} remaining
            </ThemedText>
          </View>
          
          {/* Progress Bar */}
          <View style={[styles.progressBg, { backgroundColor: theme.border }]}>
            <View style={[styles.progressFill, { 
              backgroundColor: progressPercent >= 100 ? theme.danger : theme.primary, 
              width: `${progressPercent}%` 
            }]} />
          </View>
        </View>

        {/* Today's Expenditures */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <ThemedText type="small" themeColor="textSecondary" style={styles.cardSubtitle}>
            TODAY'S SPENDING — {currency}{spentToday.toFixed(2)}
          </ThemedText>
          
          {todayCategories.length === 0 ? (
            <ThemedText type="small" themeColor="textSecondary" style={styles.emptyBreakdown}>
              No expenses recorded today.
            </ThemedText>
          ) : (
            todayCategories.map((item) => (
              <View key={item.category} style={styles.categoryItem}>
                <View style={styles.categoryInfo}>
                  <View style={[styles.categoryIconCircle, { backgroundColor: theme.primaryLight }]}>
                    <Ionicons 
                      name={CATEGORY_ICONS[item.category] as any || 'cash'} 
                      size={16} 
                      color={theme.primary} 
                    />
                  </View>
                  <ThemedText style={styles.categoryLabel}>{item.category}</ThemedText>
                </View>
                <ThemedText style={styles.categoryValue}>{currency}{item.total.toFixed(2)}</ThemedText>
              </View>
            ))
          )}
        </View>

        {/* AI Insight Card */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.insightHeader}>
            <Ionicons name="sparkles" size={18} color={theme.accent} />
            <ThemedText type="smallBold" style={[styles.insightTitle, { color: theme.accent }]}>
              AI INSIGHT
            </ThemedText>
          </View>
          {totalWeeklyDeduction > (weeklyLimit * 0.8) ? (
            <ThemedText style={styles.insightText}>
              "Alert: You have used over 80% of your weekly flexible allowance. Reducing discretionary spending for the next {daysRemaining} days is highly recommended."
            </ThemedText>
          ) : (
            <ThemedText style={styles.insightText}>
              "You are pacing well under your weekly budget. Great job balancing active expenses, savings goals, and commitments."
            </ThemedText>
          )}
        </View>

      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.four,
  },
  onboardingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.three,
    borderRadius: CornerRadius.medium,
    marginBottom: Spacing.three,
  },
  onboardingTextContainer: {
    flex: 1,
    paddingRight: Spacing.two,
  },
  bannerTitle: {
    fontWeight: '700',
    fontSize: 15,
    marginBottom: 2,
  },
  bannerBody: {
    fontSize: 13,
    lineHeight: 18,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.four,
    marginTop: Spacing.one,
  },
  greetingText: {
    fontSize: 24,
    fontWeight: '700',
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: CornerRadius.round,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    padding: Spacing.three,
    borderRadius: CornerRadius.medium,
    borderWidth: 1,
    marginBottom: Spacing.three,
  },
  cardSubtitle: {
    fontSize: 11,
    letterSpacing: 1,
    fontWeight: '700',
    marginBottom: Spacing.one,
  },
  largeAmount: {
    fontSize: 40,
    fontWeight: '800',
    marginVertical: Spacing.one,
  },
  cardExplanation: {
    fontSize: 12,
    lineHeight: 16,
  },
  budgetMetricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.two,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.1)',
    marginBottom: Spacing.two,
  },
  metricItem: {
    alignItems: 'center',
    flex: 1,
  },
  metricVal: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 2,
  },
  budgetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginTop: Spacing.one,
    marginBottom: Spacing.two,
  },
  budgetMain: {
    fontSize: 15,
    fontWeight: '600',
  },
  budgetRemaining: {
    fontSize: 13,
    fontWeight: '700',
  },
  progressBg: {
    height: 8,
    borderRadius: CornerRadius.round,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: CornerRadius.round,
  },
  emptyBreakdown: {
    fontSize: 14,
    fontStyle: 'italic',
    paddingVertical: Spacing.one,
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.two,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  categoryIconCircle: {
    width: 32,
    height: 32,
    borderRadius: CornerRadius.round,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  categoryValue: {
    fontSize: 15,
    fontWeight: '700',
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    marginBottom: Spacing.one,
  },
  insightTitle: {
    letterSpacing: 0.5,
  },
  insightText: {
    fontSize: 14,
    lineHeight: 20,
    fontStyle: 'italic',
  },
});
