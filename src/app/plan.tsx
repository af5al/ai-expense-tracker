import { StyleSheet, View, ScrollView, Pressable } from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing, CornerRadius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useSettingsStore } from '@/stores/settingsStore';

export default function PlanScreen() {
  const theme = useTheme();
  const { currency, monthlyIncome, monthlySavingsGoal } = useSettingsStore();

  const [activePlanStep, setActivePlanStep] = useState(4); // "Day 4 of 7 learning habits" simulator

  // Mock savings goal
  const mockGoal = {
    name: 'New Laptop',
    target: 2000,
    current: 350,
    date: 'Dec 2026',
    weeklySuggestion: 25,
  };

  // Mock recurring items
  const mockRecurring = [
    { id: '1', name: 'Netflix Subscription', amount: 15.99, frequency: 'monthly', isConfirmed: true },
    { id: '2', name: 'Spotify Premium', amount: 9.99, frequency: 'monthly', isConfirmed: false }, // subscription detection prompt
  ];

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Money Health Card */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionHeader}>
            MONEY HEALTH
          </ThemedText>
          <View style={styles.healthScoreRow}>
            <View style={[styles.healthScoreCircle, { borderColor: theme.success }]}>
              <ThemedText style={[styles.healthScoreNumber, { color: theme.success }]}>74</ThemedText>
              <ThemedText style={{ fontSize: 10, color: theme.textSecondary }}>/ 100</ThemedText>
            </View>
            <View style={styles.healthDetails}>
              <ThemedText style={{ fontSize: 16, fontWeight: '700' }}>Good Standing</ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={styles.healthSummary}>
                Your overall spending is under control, but dining increased this week.
              </ThemedText>
            </View>
          </View>
        </View>

        {/* First 7 Days Learning Progress */}
        {activePlanStep < 7 && (
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <ThemedText type="smallBold" themeColor="primary" style={styles.sectionHeader}>
              WEEKLY MONEY PLAN
            </ThemedText>
            <ThemedText style={styles.planInstruction}>
              Learning your spending habits — Day {activePlanStep} of 7
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={styles.planSubtext}>
              Once we gather enough data about your regular expenses, we'll suggest a personalized weekly budget structure here.
            </ThemedText>
            
            {/* Progress Bar */}
            <View style={[styles.progressBg, { backgroundColor: theme.border }]}>
              <View style={[styles.progressFill, { backgroundColor: theme.primary, width: `${(activePlanStep / 7) * 100}%` }]} />
            </View>
          </View>
        )}

        {/* Savings Goals Section */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.sectionTitleRow}>
            <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionHeader}>
              SAVINGS GOALS
            </ThemedText>
            <Pressable onPress={() => alert('Adding new goal (Starts in Phase 4)')}>
              <Ionicons name="add-circle" size={20} color={theme.primary} />
            </Pressable>
          </View>

          <View style={[styles.goalItem, { backgroundColor: theme.background, borderColor: theme.border }]}>
            <View style={styles.goalInfo}>
              <ThemedText style={styles.goalName}>{mockGoal.name}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">Target: {currency}{mockGoal.target} by {mockGoal.date}</ThemedText>
            </View>
            <View style={styles.goalProgressContainer}>
              <ThemedText style={styles.goalAmount}>
                {currency}{mockGoal.current} saved
              </ThemedText>
              <View style={[styles.progressBg, { backgroundColor: theme.border, height: 6 }]}>
                <View style={[styles.progressFill, { backgroundColor: theme.success, width: `${(mockGoal.current / mockGoal.target) * 100}%` }]} />
              </View>
            </View>
            <View style={[styles.goalGuidance, { borderTopColor: theme.border }]}>
              <Ionicons name="information-circle-outline" size={14} color={theme.success} />
              <ThemedText style={[styles.guidanceText, { color: theme.success }]}>
                Saving {currency}{mockGoal.weeklySuggestion}/week will hit your goal on schedule.
              </ThemedText>
            </View>
          </View>
        </View>

        {/* Recurring / Subscriptions Detector */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionHeader}>
            RECURRING COMMITMENTS
          </ThemedText>

          {mockRecurring.map((item) => (
            <View key={item.id} style={[styles.recurringItem, { borderBottomColor: theme.border }]}>
              <View style={{ flex: 1 }}>
                <ThemedText style={styles.recurringName}>{item.name}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {currency}{item.amount.toFixed(2)} — {item.frequency}
                </ThemedText>
              </View>
              
              {item.isConfirmed ? (
                <View style={[styles.badge, { backgroundColor: theme.primaryLight }]}>
                  <ThemedText style={{ fontSize: 10, fontWeight: '700', color: theme.primary }}>ACTIVE BILL</ThemedText>
                </View>
              ) : (
                <Pressable 
                  onPress={() => alert('Confirming recurring expense (Starts in Phase 4)')}
                  style={[styles.confirmButton, { backgroundColor: theme.success }]}
                >
                  <ThemedText style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>Confirm Subscription?</ThemedText>
                </Pressable>
              )}
            </View>
          ))}
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
    paddingBottom: Spacing.seven,
  },
  card: {
    padding: Spacing.three,
    borderRadius: CornerRadius.medium,
    borderWidth: 1,
    marginBottom: Spacing.three,
  },
  sectionHeader: {
    fontSize: 11,
    letterSpacing: 1,
    marginBottom: Spacing.two,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.one,
  },
  healthScoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  healthScoreCircle: {
    width: 64,
    height: 64,
    borderRadius: CornerRadius.round,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  healthScoreNumber: {
    fontSize: 22,
    fontWeight: '800',
  },
  healthDetails: {
    flex: 1,
  },
  healthSummary: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
  },
  planInstruction: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  planSubtext: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: Spacing.two,
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
  goalItem: {
    borderRadius: CornerRadius.medium,
    borderWidth: 1,
    padding: Spacing.two,
    marginTop: Spacing.one,
  },
  goalInfo: {
    marginBottom: Spacing.one,
  },
  goalName: {
    fontSize: 15,
    fontWeight: '700',
  },
  goalProgressContainer: {
    marginVertical: Spacing.one,
    gap: 4,
  },
  goalAmount: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'right',
  },
  goalGuidance: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Spacing.two,
    marginTop: Spacing.two,
    borderTopWidth: 1,
    gap: 6,
  },
  guidanceText: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  recurringItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.two,
    borderBottomWidth: 1,
  },
  recurringName: {
    fontSize: 14,
    fontWeight: '600',
  },
  badge: {
    paddingVertical: 4,
    paddingHorizontal: Spacing.one,
    borderRadius: CornerRadius.small,
  },
  confirmButton: {
    paddingVertical: 6,
    paddingHorizontal: Spacing.two,
    borderRadius: CornerRadius.medium,
  },
});
