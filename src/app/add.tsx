import { StyleSheet, View, ScrollView, TextInput, Pressable } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing, CornerRadius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useSettingsStore } from '@/stores/settingsStore';
import { CATEGORIES, CategoryType } from '@/types';
import { parseNaturalLanguageExpense } from '@/utils/nlpParser';
import { insertExpense } from '@/database/expenseService';
import { generateUUID } from '@/utils/uuid';

export default function AddExpenseScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { currency } = useSettingsStore();

  // Natural Language Input State
  const [nlpInput, setNlpInput] = useState('');
  
  // Manual / Edit Form State
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>('Other');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [showManualForm, setShowManualForm] = useState(false);

  const handleNlpParse = () => {
    if (!nlpInput.trim()) return;
    
    try {
      const parsed = parseNaturalLanguageExpense(nlpInput);
      setAmount(parsed.amount > 0 ? parsed.amount.toString() : '');
      setDescription(parsed.description);
      setSelectedCategory(parsed.category);
      setDate(parsed.expenseDate);
      setShowManualForm(true); // Open the verification form
    } catch (error) {
      console.error('[AddExpense] NLP parsing failed:', error);
      alert('Could not auto-parse this phrase. Please enter details manually.');
      setShowManualForm(true);
    }
  };

  const handleSave = () => {
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      alert('Please enter a valid amount greater than 0.');
      return;
    }
    if (!description.trim()) {
      alert('Please enter a valid description.');
      return;
    }

    const now = new Date().toISOString();
    const newExpense = {
      id: generateUUID(),
      amount: parsedAmount,
      description: description.trim(),
      category: selectedCategory,
      expenseDate: date,
      createdAt: now,
      updatedAt: now,
    };

    try {
      insertExpense(newExpense);
      // Reset state
      setNlpInput('');
      setAmount('');
      setDescription('');
      setSelectedCategory('Other');
      setDate(new Date().toISOString().split('T')[0]);
      setShowManualForm(false);
      
      // Navigate back to Dashboard/Home
      router.replace('/');
    } catch (error) {
      console.error('[AddExpense] Failed to insert expense:', error);
      alert('Failed to save expense locally: ' + error);
    }
  };

  const handleSelectExample = (example: string) => {
    setNlpInput(example);
    // Parse instantly for convenience
    try {
      const parsed = parseNaturalLanguageExpense(example);
      setAmount(parsed.amount > 0 ? parsed.amount.toString() : '');
      setDescription(parsed.description);
      setSelectedCategory(parsed.category);
      setDate(parsed.expenseDate);
      setShowManualForm(true);
    } catch (e) {
      setShowManualForm(true);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        
        {/* NLP Parsing Card */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionHeader}>
            QUICK ADD WITH NATURAL LANGUAGE
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={styles.subtext}>
            Type what you spent and the system will automatically extract details.
          </ThemedText>
          
          <TextInput
            placeholder="e.g. 12.50 lunch with friends today"
            placeholderTextColor={theme.textSecondary}
            value={nlpInput}
            onChangeText={setNlpInput}
            multiline
            numberOfLines={3}
            style={[styles.nlpTextInput, { 
              color: theme.text, 
              backgroundColor: theme.background, 
              borderColor: theme.border 
            }]}
          />

          <Pressable 
            onPress={handleNlpParse}
            disabled={!nlpInput.trim()}
            style={[styles.parseButton, { 
              backgroundColor: nlpInput.trim() ? theme.primary : theme.border,
              opacity: nlpInput.trim() ? 1 : 0.6 
            }]}
          >
            <ThemedText style={{ color: nlpInput.trim() ? '#fff' : theme.textSecondary, fontWeight: '700' }}>
              Parse Spending
            </ThemedText>
            <Ionicons name="sparkles" size={16} color={nlpInput.trim() ? '#fff' : theme.textSecondary} />
          </Pressable>
          
          <View style={styles.examplesContainer}>
            <ThemedText type="smallBold" themeColor="textSecondary">Try: </ThemedText>
            <Pressable onPress={() => handleSelectExample('8 coffee')}>
              <ThemedText type="code" style={styles.exampleLink}>"8 coffee"</ThemedText>
            </Pressable>
            <Pressable onPress={() => handleSelectExample('Spent 35 on fuel yesterday')}>
              <ThemedText type="code" style={styles.exampleLink}>"35 fuel yesterday"</ThemedText>
            </Pressable>
          </View>
        </View>

        {/* Toggle Manual Review Form */}
        <Pressable 
          onPress={() => setShowManualForm(!showManualForm)} 
          style={styles.toggleRow}
        >
          <ThemedText type="smallBold" themeColor="primary">
            {showManualForm ? 'Hide Details Form' : 'Use Manual Entry Fallback'}
          </ThemedText>
          <Ionicons 
            name={showManualForm ? 'chevron-up' : 'chevron-down'} 
            size={18} 
            color={theme.primary} 
          />
        </Pressable>

        {/* Manual Form/Confirmation Form */}
        {showManualForm && (
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionHeader}>
              REVIEW & SAVE
            </ThemedText>

            {/* Amount */}
            <ThemedText style={styles.fieldLabel}>Amount ({currency})</ThemedText>
            <TextInput
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor={theme.textSecondary}
              value={amount}
              onChangeText={setAmount}
              style={[styles.manualInput, { color: theme.text, backgroundColor: theme.background, borderColor: theme.border }]}
            />

            {/* Description */}
            <ThemedText style={styles.fieldLabel}>Description</ThemedText>
            <TextInput
              placeholder="e.g. Lunch at Dino's"
              placeholderTextColor={theme.textSecondary}
              value={description}
              onChangeText={setDescription}
              style={[styles.manualInput, { color: theme.text, backgroundColor: theme.background, borderColor: theme.border }]}
            />

            {/* Category Grid */}
            <ThemedText style={styles.fieldLabel}>Category</ThemedText>
            <View style={styles.categoryGrid}>
              {CATEGORIES.map((cat) => {
                const isSelected = selectedCategory === cat;
                return (
                  <Pressable
                    key={cat}
                    onPress={() => setSelectedCategory(cat)}
                    style={[styles.gridCell, {
                      borderColor: theme.border,
                      backgroundColor: isSelected ? theme.primaryLight : theme.background,
                    }]}
                  >
                    <ThemedText style={{ 
                      fontSize: 13, 
                      fontWeight: isSelected ? '700' : '500', 
                      color: isSelected ? theme.primary : theme.text 
                    }}>
                      {cat}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>

            {/* Date */}
            <ThemedText style={styles.fieldLabel}>Date</ThemedText>
            <TextInput
              placeholder="YYYY-MM-DD"
              placeholderTextColor={theme.textSecondary}
              value={date}
              onChangeText={setDate}
              style={[styles.manualInput, { color: theme.text, backgroundColor: theme.background, borderColor: theme.border }]}
            />

            {/* Save Button */}
            <Pressable 
              onPress={handleSave}
              disabled={!amount || !description}
              style={[styles.saveButton, { 
                backgroundColor: (amount && description) ? theme.success : theme.border,
                opacity: (amount && description) ? 1 : 0.6
              }]}
            >
              <ThemedText style={{ color: '#fff', fontWeight: '700' }}>Save Expense</ThemedText>
            </Pressable>
          </View>
        )}

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
    fontSize: 12,
    letterSpacing: 1,
    marginBottom: 4,
  },
  subtext: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: Spacing.two,
  },
  nlpTextInput: {
    height: 80,
    borderRadius: CornerRadius.medium,
    borderWidth: 1,
    padding: Spacing.two,
    textAlignVertical: 'top',
    fontSize: 15,
    marginBottom: Spacing.three,
  },
  parseButton: {
    height: 48,
    borderRadius: CornerRadius.medium,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.one,
  },
  examplesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.two,
    gap: Spacing.one,
  },
  exampleLink: {
    marginRight: Spacing.one,
    textDecorationLine: 'underline',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.one,
    marginBottom: Spacing.two,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: Spacing.two,
    marginBottom: Spacing.one,
  },
  manualInput: {
    height: 44,
    borderRadius: CornerRadius.medium,
    borderWidth: 1,
    paddingHorizontal: Spacing.two,
    fontSize: 15,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.one,
    marginVertical: Spacing.one,
  },
  gridCell: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.two,
    borderRadius: CornerRadius.small,
    borderWidth: 1,
    minWidth: '22%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButton: {
    height: 48,
    borderRadius: CornerRadius.medium,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.four,
  },
});
