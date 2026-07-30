import { StyleSheet, View, ScrollView, TextInput, Pressable, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useState, useRef, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing, CornerRadius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useSettingsStore } from '@/stores/settingsStore';
import { askAIAssistant } from '@/services/ai';
import { getSpentThisWeek, getExpenses, getSpentToday } from '@/database/expenseService';
import { getGoals } from '@/database/goalsService';
import { getRecurringExpenses } from '@/database/recurringService';
import { calculateSafeToSpendToday, calculateWeeklyGoalContributions } from '@/analytics/safeToSpend';
import { getCategoryTotals } from '@/analytics/spending';

interface Message {
  id: string;
  sender: 'user' | 'assistant' | 'system-warning';
  text: string;
  timestamp: Date;
}

export default function AssistantScreen() {
  const theme = useTheme();
  const scrollViewRef = useRef<ScrollView>(null);

  // Settings
  const { currency, monthlyIncome, monthlySavingsGoal } = useSettingsStore();

  // Chat UI States
  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'assistant',
      text: `Hello! I'm your AI Money Assistant. I explain your local database records in plain language.\n\nAsk me questions like:\n• "Where did my money go?"\n• "Can I spend $50 this weekend?"`,
      timestamp: new Date(),
    },
  ]);

  // Local Financial Context Cache
  const [cachedContext, setCachedContext] = useState<any>(null);

  // Load and calculate local context on screen focus
  const loadContext = useCallback(async () => {
    try {
      const spentThisWeek = await getSpentThisWeek();
      const allExpenses = await getExpenses();
      const spentToday = await getSpentToday();
      
      const monthlyFlexible = Math.max(0, monthlyIncome - monthlySavingsGoal);
      const weeklyLimit = monthlyIncome > 0 ? Math.round(monthlyFlexible / 4.33) : 400;
      
      // Days remaining
      const day = new Date().getDay();
      const mondayBasedDay = day === 0 ? 7 : day;
      const daysRemaining = 8 - mondayBasedDay;

      // Savings Goals
      const activeGoals = await getGoals();
      const weeklyGoalSavings = calculateWeeklyGoalContributions(activeGoals);
      const goalProgress = activeGoals.length > 0 
        ? activeGoals.reduce((sum, g) => sum + g.currentAmount, 0) / activeGoals.reduce((sum, g) => sum + g.targetAmount, 0)
        : 0;

      // Active Bills Due
      const bills = await getRecurringExpenses(true);
      
      // Calculate Safe to Spend Today
      const safeToSpend = calculateSafeToSpendToday({
        weeklyLimit,
        spentThisWeek,
        daysRemaining,
        recurringDueThisWeek: 0, // default placeholder
        weeklySavingsContribution: weeklyGoalSavings,
      });

      // Categories totals
      const categoryTotals = getCategoryTotals(allExpenses);

      setCachedContext({
        currency,
        budgetRemaining: Math.max(0, weeklyLimit - spentThisWeek - weeklyGoalSavings),
        safeToSpendToday: safeToSpend,
        savingsGoalProgress: parseFloat((goalProgress * 100).toFixed(0)),
        categories: categoryTotals,
      });

    } catch (e) {
      console.warn('[Assistant] Failed to load local aggregates context:', e);
    }
  }, [currency, monthlyIncome, monthlySavingsGoal]);

  useFocusEffect(
    useCallback(() => {
      loadContext();
    }, [loadContext])
  );

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || inputMessage;
    if (!text.trim() || isSending) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: text.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setIsSending(true);
    
    // Auto-scroll
    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);

    // Context fallback defaults
    const context = cachedContext || {
      currency,
      budgetRemaining: 400,
      safeToSpendToday: 50,
      savingsGoalProgress: 0,
      categories: {},
    };

    try {
      const response = await askAIAssistant(text.trim(), context);
      
      const assistantMsg: Message = {
        id: Date.now().toString(),
        sender: response.warningCode === 'BUDGET_EXCEEDED' ? 'system-warning' : 'assistant',
        text: response.reply,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (error: any) {
      // Append the structured offline warning message as the response
      const offlineMsg: Message = {
        id: Date.now().toString(),
        sender: 'assistant',
        text: error.message, // Shows: "AI insights are unavailable right now. Your expenses are still saved..."
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, offlineMsg]);
    } finally {
      setIsSending(false);
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  const QUICK_PROMPTS = [
    'Where did most of my money go?',
    `Can I spend ${currency}100 this weekend?`,
    'How can I save more next month?',
  ];

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      style={{ flex: 1 }}
    >
      <ThemedView style={styles.container}>
        {/* Chat Message Scroll */}
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            const isWarning = msg.sender === 'system-warning';
            
            return (
              <View
                key={msg.id}
                style={[
                  styles.messageWrapper,
                  isUser ? styles.userWrapper : styles.assistantWrapper,
                ]}
              >
                {!isUser && (
                  <View style={[
                    styles.avatar, 
                    { backgroundColor: isWarning ? theme.danger : theme.accent }
                  ]}>
                    <Ionicons name={isWarning ? 'alert-circle' : 'sparkles'} size={14} color="#fff" />
                  </View>
                )}
                
                <View
                  style={[
                    styles.bubble,
                    isUser
                      ? [styles.userBubble, { backgroundColor: theme.primary }]
                      : isWarning
                      ? [styles.warningBubble, { backgroundColor: theme.primaryLight, borderColor: theme.danger }]
                      : [styles.assistantBubble, { backgroundColor: theme.card, borderColor: theme.border }],
                  ]}
                >
                  <ThemedText style={{ 
                    color: isUser ? '#fff' : isWarning ? theme.danger : theme.text, 
                    fontSize: 14, 
                    lineHeight: 20,
                    fontWeight: isWarning ? '600' : '500'
                  }}>
                    {msg.text}
                  </ThemedText>
                </View>
              </View>
            );
          })}

          {isSending && (
            <View style={[styles.messageWrapper, styles.assistantWrapper]}>
              <View style={[styles.avatar, { backgroundColor: theme.accent }]}>
                <Ionicons name="sparkles" size={14} color="#fff" />
              </View>
              <View style={[styles.bubble, styles.assistantBubble, { backgroundColor: theme.card, borderColor: theme.border, paddingVertical: 12 }]}>
                <ActivityIndicator size="small" color={theme.accent} />
              </View>
            </View>
          )}
        </ScrollView>

        {/* Quick Suggestion Chips */}
        {messages.length === 1 && !isSending && (
          <View style={styles.chipsContainer}>
            {QUICK_PROMPTS.map((prompt) => (
              <Pressable
                key={prompt}
                onPress={() => handleSend(prompt)}
                style={[styles.chip, { backgroundColor: theme.card, borderColor: theme.border }]}
              >
                <ThemedText type="small" themeColor="primary">
                  {prompt}
                </ThemedText>
              </Pressable>
            ))}
          </View>
        )}

        {/* AI Disclaimer Footnote */}
        <View style={[styles.disclaimer, { borderTopColor: theme.border }]}>
          <ThemedText style={styles.disclaimerText} type="small" themeColor="textSecondary">
            AI Assistant provides budgeting guidance, not certified financial advice.
          </ThemedText>
        </View>

        {/* Input Bar */}
        <View style={[styles.inputBar, { backgroundColor: theme.card, borderTopColor: theme.border }]}>
          <TextInput
            placeholder="Ask about your spending..."
            placeholderTextColor={theme.textSecondary}
            value={inputMessage}
            onChangeText={setInputMessage}
            editable={!isSending}
            style={[styles.textInput, { color: theme.text }]}
          />
          <Pressable
            onPress={() => handleSend()}
            disabled={!inputMessage.trim() || isSending}
            style={[styles.sendButton, { 
              backgroundColor: inputMessage.trim() && !isSending ? theme.primary : theme.border,
              opacity: inputMessage.trim() && !isSending ? 1 : 0.6 
            }]}
          >
            <Ionicons 
              name="send" 
              size={16} 
              color={inputMessage.trim() && !isSending ? '#fff' : theme.textSecondary} 
            />
          </Pressable>
        </View>
      </ThemedView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.three,
    paddingBottom: Spacing.four,
  },
  messageWrapper: {
    flexDirection: 'row',
    marginBottom: Spacing.three,
    alignItems: 'flex-end',
    gap: Spacing.one,
  },
  userWrapper: {
    justifyContent: 'flex-end',
  },
  assistantWrapper: {
    justifyContent: 'flex-start',
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: CornerRadius.round,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  bubble: {
    padding: Spacing.two,
    borderRadius: CornerRadius.medium,
    maxWidth: '80%',
  },
  userBubble: {
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    borderWidth: 1,
    borderBottomLeftRadius: 4,
  },
  warningBubble: {
    borderWidth: 1,
    borderBottomLeftRadius: 4,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.one,
    paddingHorizontal: Spacing.three,
    marginBottom: Spacing.two,
  },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: Spacing.two,
    borderRadius: CornerRadius.round,
    borderWidth: 1,
  },
  disclaimer: {
    paddingVertical: 6,
    paddingHorizontal: Spacing.three,
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  disclaimerText: {
    fontSize: 10,
    textAlign: 'center',
  },
  inputBar: {
    flexDirection: 'row',
    padding: Spacing.two,
    alignItems: 'center',
    gap: Spacing.two,
    borderTopWidth: 1,
  },
  textInput: {
    flex: 1,
    height: 40,
    borderRadius: CornerRadius.round,
    borderWidth: 0,
    paddingHorizontal: Spacing.three,
    fontSize: 15,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: CornerRadius.round,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
