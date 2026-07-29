import { StyleSheet, View, ScrollView, Pressable, Modal, TextInput, Alert } from 'react-native';
import { useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing, CornerRadius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useSettingsStore } from '@/stores/settingsStore';
import { SavingsGoal, RecurringExpense, CategoryType, CATEGORIES } from '@/types';
import { getGoals, insertGoal, updateGoal, deleteGoal, updateGoalProgress } from '@/database/goalsService';
import { getRecurringExpenses, insertRecurringExpense, deleteRecurringExpense, activateRecurringExpense } from '@/database/recurringService';
import { getExpenses, getSpentThisWeek } from '@/database/expenseService';
import { calculateWeeklyGoalContributions } from '@/analytics/safeToSpend';
import { calculateMoneyHealthScore } from '@/analytics/moneyHealth';
import { detectRecurringFromExpenses, RecurringSuggestion } from '@/analytics/recurring';
import { getDailySpending } from '@/analytics/spending';
import { generateUUID } from '@/utils/uuid';

export default function PlanScreen() {
  const theme = useTheme();
  const { currency, monthlyIncome, monthlySavingsGoal, onboardingCompleted } = useSettingsStore();

  // Screen Data States
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [recurringBills, setRecurringBills] = useState<RecurringExpense[]>([]);
  const [detectedCommitments, setDetectedCommitments] = useState<RecurringSuggestion[]>([]);
  
  // Health Score Metrics
  const [healthScore, setHealthScore] = useState(100);
  const [healthRating, setHealthRating] = useState<'Excellent' | 'Good' | 'Average' | 'Poor'>('Excellent');
  const [healthExplanation, setHealthExplanation] = useState('');

  // Goal Modal states
  const [isGoalModalVisible, setIsGoalModalVisible] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);
  const [goalName, setGoalName] = useState('');
  const [goalTargetAmount, setGoalTargetAmount] = useState('');
  const [goalCurrentAmount, setGoalCurrentAmount] = useState('');
  const [goalTargetDate, setGoalTargetDate] = useState(''); // YYYY-MM

  // Fetch SQLite aggregates and recalculate health & subscriptions
  const refreshPlanData = useCallback(() => {
    try {
      const activeGoals = getGoals();
      const activeRecurring = getRecurringExpenses();
      const allExpenses = getExpenses();

      setGoals(activeGoals);
      setRecurringBills(activeRecurring);

      // 1. Calculate default budget limit: (Income - Savings Goal) / 4.33
      const monthlyFlexible = Math.max(0, monthlyIncome - monthlySavingsGoal);
      const weeklyLimit = monthlyIncome > 0 ? Math.round(monthlyFlexible / 4.33) : 400;
      const spentThisWeek = getSpentThisWeek();

      // 2. Fetch daily history for variance
      const dailyMap = getDailySpending(allExpenses);
      // Take the last 7 days of daily spending history as values array
      const dailyHistory = Object.values(dailyMap).slice(0, 7);

      // 3. Sum active monthly recurring commitments
      const totalMonthlyRecurring = activeRecurring
        .filter(r => r.active)
        .reduce((sum, item) => {
          const amt = item.amount;
          return sum + (item.frequency === 'weekly' ? amt * 4.33 : amt);
        }, 0);

      // 4. Calculate actual savings saved so far across all goals
      const actualSavedThisMonth = activeGoals.reduce((sum, g) => sum + g.currentAmount, 0);

      // 5. Calculate Money Health
      const health = calculateMoneyHealthScore({
        weeklyLimit,
        spentThisWeek,
        monthlyIncome,
        monthlySavingsTarget: monthlySavingsGoal,
        actualSavedThisMonth,
        dailySpendingHistory: dailyHistory.length > 0 ? dailyHistory : [0],
        totalMonthlyRecurring,
      });

      setHealthScore(health.score);
      setHealthRating(health.rating);
      setHealthExplanation(health.explanation);

      // 6. Detect new recurring bills (Offline Pattern Engine)
      const suggestions = detectRecurringFromExpenses(allExpenses, activeRecurring);
      setDetectedCommitments(suggestions);

    } catch (e) {
      console.error('[Plan] Failed to aggregate planning data:', e);
    }
  }, [monthlyIncome, monthlySavingsGoal]);

  useFocusEffect(
    useCallback(() => {
      refreshPlanData();
    }, [refreshPlanData])
  );

  // Goal CRUD
  const openAddGoalModal = () => {
    setEditingGoal(null);
    setGoalName('');
    setGoalTargetAmount('');
    setGoalCurrentAmount('');
    
    // Set default target date to 6 months in the future YYYY-MM
    const future = new Date();
    future.setMonth(future.getMonth() + 6);
    setGoalTargetDate(future.toISOString().substring(0, 7));

    setIsGoalModalVisible(true);
  };

  const openEditGoalModal = (goal: SavingsGoal) => {
    setEditingGoal(goal);
    setGoalName(goal.name);
    setGoalTargetAmount(goal.targetAmount.toString());
    setGoalCurrentAmount(goal.currentAmount.toString());
    setGoalTargetDate(goal.targetDate);
    setIsGoalModalVisible(true);
  };

  const handleSaveGoal = () => {
    const target = parseFloat(goalTargetAmount);
    const current = parseFloat(goalCurrentAmount) || 0;

    if (!goalName.trim()) {
      alert('Please enter a goal name.');
      return;
    }
    if (isNaN(target) || target <= 0) {
      alert('Please enter a valid target amount.');
      return;
    }
    if (!/^\d{4}-\d{2}$/.test(goalTargetDate)) {
      alert('Please enter date in YYYY-MM format.');
      return;
    }

    const now = new Date().toISOString();

    if (editingGoal) {
      const updated: SavingsGoal = {
        ...editingGoal,
        name: goalName.trim(),
        targetAmount: target,
        currentAmount: current,
        targetDate: goalTargetDate,
      };
      updateGoal(updated);
    } else {
      const created: SavingsGoal = {
        id: generateUUID(),
        name: goalName.trim(),
        targetAmount: target,
        currentAmount: current,
        targetDate: goalTargetDate,
        createdAt: now,
      };
      insertGoal(created);
    }

    setIsGoalModalVisible(false);
    refreshPlanData();
  };

  const handleDeleteGoal = (id: string, name: string) => {
    Alert.alert(
      'Delete Savings Goal?',
      `Are you sure you want to delete "${name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            deleteGoal(id);
            refreshPlanData();
          }
        }
      ]
    );
  };

  // Confirm/Add Suggestion Recurring Commitments
  const handleConfirmRecurring = (suggestion: RecurringSuggestion) => {
    const newBill: RecurringExpense = {
      id: generateUUID(),
      description: suggestion.description,
      amount: suggestion.amount,
      category: suggestion.category,
      frequency: suggestion.frequency,
      nextExpectedDate: suggestion.nextExpectedDate,
      active: true,
    };
    try {
      insertRecurringExpense(newBill);
      refreshPlanData();
      alert(`"${suggestion.description}" has been added to your commitments!`);
    } catch (e) {
      alert('Failed to register subscription: ' + e);
    }
  };

  // Remove Recurring Bill
  const handleDeleteRecurring = (id: string, description: string) => {
    Alert.alert(
      'Remove commitment?',
      `Stop tracking "${description}" as a recurring expense?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: () => {
            deleteRecurringExpense(id);
            refreshPlanData();
          }
        }
      ]
    );
  };

  // Safe color for Money Health rating
  const getHealthColor = (rating: string) => {
    if (rating === 'Excellent' || rating === 'Good') return theme.success;
    if (rating === 'Average') return theme.warning;
    return theme.danger;
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Money Health Score Ring Card */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionHeader}>
            MONEY HEALTH SCORE
          </ThemedText>
          <View style={styles.healthScoreRow}>
            <View style={[styles.healthScoreCircle, { borderColor: getHealthColor(healthRating) }]}>
              <ThemedText style={[styles.healthScoreNumber, { color: getHealthColor(healthRating) }]}>
                {healthScore}
              </ThemedText>
              <ThemedText style={{ fontSize: 10, color: theme.textSecondary }}>/ 100</ThemedText>
            </View>
            <View style={styles.healthDetails}>
              <ThemedText style={{ fontSize: 16, fontWeight: '700', color: getHealthColor(healthRating) }}>
                {healthRating} Standing
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={styles.healthSummary}>
                {healthExplanation}
              </ThemedText>
            </View>
          </View>
        </View>

        {/* Savings Goals Card */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.sectionTitleRow}>
            <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionHeader}>
              SAVINGS GOALS
            </ThemedText>
            <Pressable onPress={openAddGoalModal}>
              <Ionicons name="add-circle" size={24} color={theme.primary} />
            </Pressable>
          </View>

          {goals.length === 0 ? (
            <View style={styles.emptyCardInner}>
              <ThemedText type="small" themeColor="textSecondary" style={{ textAlign: 'center' }}>
                No active savings goals. Tap the plus button to define your target (e.g. laptop, travel).
              </ThemedText>
            </View>
          ) : (
            goals.map((goal) => {
              const pct = goal.targetAmount > 0 ? Math.min(100, (goal.currentAmount / goal.targetAmount) * 100) : 0;
              // Calculate suggestions using safeToSpend math helper
              const rate = calculateWeeklyGoalContributions([goal]);
              return (
                <View key={goal.id} style={[styles.goalItem, { backgroundColor: theme.background, borderColor: theme.border }]}>
                  <View style={styles.goalInfo}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <ThemedText style={styles.goalName}>{goal.name}</ThemedText>
                      <View style={styles.goalRowActions}>
                        <Pressable onPress={() => openEditGoalModal(goal)}>
                          <Ionicons name="pencil-outline" size={16} color={theme.textSecondary} style={{ marginRight: 10 }} />
                        </Pressable>
                        <Pressable onPress={() => handleDeleteGoal(goal.id, goal.name)}>
                          <Ionicons name="trash-outline" size={16} color={theme.danger} />
                        </Pressable>
                      </View>
                    </View>
                    <ThemedText type="small" themeColor="textSecondary">
                      Target: {currency}{goal.targetAmount.toFixed(0)} by {goal.targetDate}
                    </ThemedText>
                  </View>

                  <View style={styles.goalProgressContainer}>
                    <ThemedText style={styles.goalAmount}>
                      {currency}{goal.currentAmount.toFixed(0)} saved ({Math.round(pct)}%)
                    </ThemedText>
                    <View style={[styles.progressBg, { backgroundColor: theme.border, height: 6 }]}>
                      <View style={[styles.progressFill, { backgroundColor: theme.success, width: `${pct}%` }]} />
                    </View>
                  </View>
                  
                  {rate > 0 && (
                    <View style={[styles.goalGuidance, { borderTopColor: theme.border }]}>
                      <Ionicons name="information-circle-outline" size={14} color={theme.success} />
                      <ThemedText style={[styles.guidanceText, { color: theme.success }]}>
                        Saving {currency}{rate.toFixed(0)}/week stays on schedule.
                      </ThemedText>
                    </View>
                  )}
                </View>
              );
            })
          )}
        </View>

        {/* Subscription Suggestion Banner (Pattern Engine Alert) */}
        {detectedCommitments.length > 0 && (
          <View style={[styles.card, { backgroundColor: theme.primaryLight, borderColor: theme.primary }]}>
            <View style={styles.insightHeader}>
              <Ionicons name="sparkles" size={18} color={theme.primary} />
              <ThemedText type="smallBold" style={{ color: theme.primary, letterSpacing: 0.5 }}>
                SUBSCRIPTION DETECTED
              </ThemedText>
            </View>
            <ThemedText type="small" themeColor="textSecondary" style={{ marginBottom: 12 }}>
              Our Pattern Engine noticed repeated transactions that look like recurring bills:
            </ThemedText>
            
            {detectedCommitments.map((sug) => (
              <View key={sug.description} style={[styles.sugItem, { borderBottomColor: theme.border }]}>
                <View style={{ flex: 1 }}>
                  <ThemedText style={{ fontSize: 14, fontWeight: '700' }}>{sug.description}</ThemedText>
                  <ThemedText style={{ fontSize: 12, color: theme.textSecondary }}>
                    {currency}{sug.amount.toFixed(2)} — {sug.frequency}
                  </ThemedText>
                </View>
                <Pressable
                  onPress={() => handleConfirmRecurring(sug)}
                  style={[styles.confirmButton, { backgroundColor: theme.primary }]}
                >
                  <ThemedText style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>Track Bill</ThemedText>
                </Pressable>
              </View>
            ))}
          </View>
        )}

        {/* Active Commitments Card */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionHeader}>
            RECURRING BILLS & COMMITMENTS
          </ThemedText>

          {recurringBills.length === 0 ? (
            <View style={styles.emptyCardInner}>
              <ThemedText type="small" themeColor="textSecondary" style={{ textAlign: 'center' }}>
                No active commitments are registered. Confirm suggested subscriptions above to track them.
              </ThemedText>
            </View>
          ) : (
            recurringBills.map((item) => (
              <View key={item.id} style={[styles.recurringItem, { borderBottomColor: theme.border }]}>
                <View style={{ flex: 1 }}>
                  <ThemedText style={styles.recurringName}>{item.description}</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {currency}{item.amount.toFixed(2)} — {item.frequency} (Due: {item.nextExpectedDate})
                  </ThemedText>
                </View>
                
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.two }}>
                  <View style={[styles.badge, { backgroundColor: theme.primaryLight }]}>
                    <ThemedText style={{ fontSize: 9, fontWeight: '700', color: theme.primary }}>ACTIVE</ThemedText>
                  </View>
                  <Pressable onPress={() => handleDeleteRecurring(item.id, item.description)}>
                    <Ionicons name="trash-outline" size={16} color={theme.danger} />
                  </Pressable>
                </View>
              </View>
            ))
          )}
        </View>

      </ScrollView>

      {/* Goal Modal Dialog (Add / Edit) */}
      <Modal
        visible={isGoalModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsGoalModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <ThemedView style={[styles.modalContent, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.modalHeader}>
              <ThemedText type="smallBold">{editingGoal ? 'Edit Savings Goal' : 'New Savings Goal'}</ThemedText>
              <Pressable onPress={() => setIsGoalModalVisible(false)}>
                <Ionicons name="close" size={24} color={theme.text} />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.modalForm} keyboardShouldPersistTaps="handled">
              
              <ThemedText style={styles.fieldLabel}>Goal Name</ThemedText>
              <TextInput
                placeholder="e.g. New Laptop"
                placeholderTextColor={theme.textSecondary}
                value={goalName}
                onChangeText={setGoalName}
                style={[styles.modalInput, { color: theme.text, backgroundColor: theme.background, borderColor: theme.border }]}
              />

              <ThemedText style={styles.fieldLabel}>Target Amount ({currency})</ThemedText>
              <TextInput
                placeholder="e.g. 1500"
                placeholderTextColor={theme.textSecondary}
                keyboardType="decimal-pad"
                value={goalTargetAmount}
                onChangeText={setGoalTargetAmount}
                style={[styles.modalInput, { color: theme.text, backgroundColor: theme.background, borderColor: theme.border }]}
              />

              <ThemedText style={styles.fieldLabel}>Saved So Far ({currency})</ThemedText>
              <TextInput
                placeholder="e.g. 200 (Optional)"
                placeholderTextColor={theme.textSecondary}
                keyboardType="decimal-pad"
                value={goalCurrentAmount}
                onChangeText={setGoalCurrentAmount}
                style={[styles.modalInput, { color: theme.text, backgroundColor: theme.background, borderColor: theme.border }]}
              />

              <SelectedDateInput 
                value={goalTargetDate}
                onChange={setGoalTargetDate}
                theme={theme}
              />

              <Pressable 
                onPress={handleSaveGoal}
                style={[styles.saveButton, { backgroundColor: theme.success }]}
              >
                <ThemedText style={{ color: '#fff', fontWeight: '700' }}>Save Goal</ThemedText>
              </Pressable>
            </ScrollView>
          </ThemedView>
        </View>
      </Modal>
    </ThemedView>
  );
}

// Simple internal component to prevent prop drill for targetDate YYYY-MM
function SelectedDateInput({ value, onChange, theme }: { value: string; onChange: (v: string) => void; theme: any }) {
  return (
    <>
      <ThemedText style={styles.fieldLabel}>Target Month (YYYY-MM)</ThemedText>
      <TextInput
        placeholder="YYYY-MM (e.g. 2026-12)"
        placeholderTextColor={theme.textSecondary}
        value={value}
        onChangeText={onChange}
        style={[styles.modalInput, { color: theme.text, backgroundColor: theme.background, borderColor: theme.border }]}
      />
    </>
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
  emptyCardInner: {
    paddingVertical: Spacing.three,
  },
  goalItem: {
    borderRadius: CornerRadius.medium,
    borderWidth: 1,
    padding: Spacing.two,
    marginTop: Spacing.two,
  },
  goalInfo: {
    marginBottom: Spacing.one,
  },
  goalName: {
    fontSize: 15,
    fontWeight: '700',
  },
  goalRowActions: {
    flexDirection: 'row',
    alignItems: 'center',
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
  progressBg: {
    height: 8,
    borderRadius: CornerRadius.round,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: CornerRadius.round,
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
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    marginBottom: Spacing.one,
  },
  sugItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.two,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  confirmButton: {
    paddingVertical: 6,
    paddingHorizontal: Spacing.two,
    borderRadius: CornerRadius.medium,
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
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: CornerRadius.small,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: CornerRadius.large,
    borderTopRightRadius: CornerRadius.large,
    borderTopWidth: 1,
    maxHeight: '85%',
    padding: Spacing.three,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.two,
    paddingBottom: Spacing.two,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  modalForm: {
    paddingBottom: Spacing.six,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: Spacing.two,
    marginBottom: Spacing.one,
  },
  modalInput: {
    height: 44,
    borderRadius: CornerRadius.medium,
    borderWidth: 1,
    paddingHorizontal: Spacing.two,
    fontSize: 14,
  },
  saveButton: {
    height: 48,
    borderRadius: CornerRadius.medium,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.four,
  },
});
