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
import { CategoryType } from '@/types';

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

  // Calculate default budget limit: (Income - Savings) / 4.33
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

  // Safe to Spend Today formula (refined in Phase 4)
  const remainingWeeklyBudget = Math.max(0, weeklyLimit - spentThisWeek);
  const safeToSpendToday = Math.round(remainingWeeklyBudget / daysRemaining);

  const refreshDashboard = useCallback(() => {
    try {
      const todayTotal = getSpentToday();
      const weekTotal = getSpentThisWeek();
      const todayCats = getSpentTodayByCategory();

      setSpentToday(todayTotal);
      setSpentThisWeek(weekTotal);
      setTodayCategories(todayCats);
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

  const progressPercent = weeklyLimit > 0 ? Math.min(100, (spentThisWeek / weeklyLimit) * 100) : 0;

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
            Calculated from {currency}{remainingWeeklyBudget} remaining weekly flexible budget and {daysRemaining} days left in this cycle.
          </ThemedText>
        </View>

        {/* Weekly Budget Progress Card */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <ThemedText type="small" themeColor="textSecondary" style={styles.cardSubtitle}>
            THIS WEEK
          </ThemedText>
          <View style={styles.budgetRow}>
            <ThemedText style={styles.budgetMain}>
              Spent {currency}{spentThisWeek.toFixed(2)} of {currency}{weeklyLimit}
            </ThemedText>
            <ThemedText style={[styles.budgetRemaining, { color: theme.primary }]}>
              {currency}{remainingWeeklyBudget.toFixed(2)} remaining
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

        {/* AI Insight Placeholder */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.insightHeader}>
            <Ionicons name="sparkles" size={18} color={theme.accent} />
            <ThemedText type="smallBold" style={[styles.insightTitle, { color: theme.accent }]}>
              AI INSIGHT
            </ThemedText>
          </View>
          {spentThisWeek > (weeklyLimit * 0.7) ? (
            <ThemedText style={styles.insightText}>
              "You've consumed over 70% of your weekly allowance with {daysRemaining} days left. Consider dialing back non-essential shopping to finish within budget."
            </ThemedText>
          ) : (
            <ThemedText style={styles.insightText}>
              "You are pacing well under your weekly budget. Good job on keeping discretionary spending stable."
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
  budgetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginTop: Spacing.one,
    marginBottom: Spacing.two,
  },
  budgetMain: {
    fontSize: 16,
    fontWeight: '600',
  },
  budgetRemaining: {
    fontSize: 14,
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
