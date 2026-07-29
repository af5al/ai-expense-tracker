import { StyleSheet, View, ScrollView, TextInput, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { useState, useRef } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing, CornerRadius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useSettingsStore } from '@/stores/settingsStore';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: Date;
}

export default function AssistantScreen() {
  const theme = useTheme();
  const { currency } = useSettingsStore();
  const scrollViewRef = useRef<ScrollView>(null);

  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'assistant',
      text: `Hello! I'm your AI Money Assistant. I translate your device's financial records into plain English.\n\nAsk me questions like:\n• "Where did my money go?"\n• "Can I spend $50 this weekend?"`,
      timestamp: new Date(),
    },
  ]);

  const handleSend = (textToSend?: string) => {
    const text = textToSend || inputMessage;
    if (!text.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: text.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    
    // Auto-scroll
    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);

    // Simulate serverless response delay
    setTimeout(() => {
      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        text: `Based on your aggregate statistics:\n• You spent ${currency}284 this week.\n• Your primary expense was Food (${currency}22 today).\n• You have ${currency}136 remaining in your flexible weekly limit.\n\nYes! You can spend ${currency}50 this weekend. If you do, it leaves you with a ${currency}86 buffer before your new cycle starts.`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    }, 1000);
  };

  const QUICK_PROMPTS = [
    'Where did most of my money go?',
    'Can I spend $100 this weekend?',
    'How can I save $200 next month?',
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
            return (
              <View
                key={msg.id}
                style={[
                  styles.messageWrapper,
                  isUser ? styles.userWrapper : styles.assistantWrapper,
                ]}
              >
                {!isUser && (
                  <View style={[styles.avatar, { backgroundColor: theme.accent }]}>
                    <Ionicons name="sparkles" size={14} color="#fff" />
                  </View>
                )}
                
                <View
                  style={[
                    styles.bubble,
                    isUser
                      ? [styles.userBubble, { backgroundColor: theme.primary }]
                      : [styles.assistantBubble, { backgroundColor: theme.card, borderColor: theme.border }],
                  ]}
                >
                  <ThemedText style={{ color: isUser ? '#fff' : theme.text, fontSize: 14, lineHeight: 20 }}>
                    {msg.text}
                  </ThemedText>
                </View>
              </View>
            );
          })}
        </ScrollView>

        {/* Quick Suggestion Chips */}
        {messages.length === 1 && (
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
            style={[styles.textInput, { color: theme.text }]}
          />
          <Pressable
            onPress={() => handleSend()}
            disabled={!inputMessage.trim()}
            style={[styles.sendButton, { 
              backgroundColor: inputMessage.trim() ? theme.primary : theme.border,
              opacity: inputMessage.trim() ? 1 : 0.6 
            }]}
          >
            <Ionicons 
              name="send" 
              size={16} 
              color={inputMessage.trim() ? '#fff' : theme.textSecondary} 
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
