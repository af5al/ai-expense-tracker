import { StyleSheet, View, ScrollView, TextInput, Pressable, Modal, Alert } from 'react-native';
import { useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing, CornerRadius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useSettingsStore } from '@/stores/settingsStore';
import { CATEGORIES, CategoryType, Expense } from '@/types';
import { getExpenses, deleteExpense, updateExpense } from '@/database/expenseService';

export default function HistoryScreen() {
  const theme = useTheme();
  const { currency } = useSettingsStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryType | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);

  // Edit Modal State
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCategory, setEditCategory] = useState<CategoryType>('Other');
  const [editDate, setEditDate] = useState('');
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);

  // Fetch from DB
  const refreshExpenses = useCallback(async () => {
    try {
      const list = await getExpenses({
        search: searchQuery.trim() || undefined,
        category: selectedCategory || undefined,
      });
      setExpenses(list);
    } catch (error) {
      console.error('[History] Failed to retrieve expenses:', error);
    }
  }, [searchQuery, selectedCategory]);

  // Refresh every time screen comes into focus
  useFocusEffect(
    useCallback(() => {
      refreshExpenses();
    }, [refreshExpenses])
  );

  // Delete Action
  const handleDelete = (id: string, description: string) => {
    Alert.alert(
      'Delete Expense?',
      `Are you sure you want to delete "${description}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteExpense(id);
              await refreshExpenses();
            } catch (e) {
              alert('Failed to delete expense: ' + e);
            }
          }
        }
      ]
    );
  };

  // Open Edit Modal
  const openEditModal = (expense: Expense) => {
    setEditingExpense(expense);
    setEditAmount(expense.amount.toString());
    setEditDescription(expense.description);
    setEditCategory(expense.category);
    setEditDate(expense.expenseDate);
    setIsEditModalVisible(true);
  };

  // Save Edit Action
  const handleSaveEdit = async () => {
    if (!editingExpense) return;
    
    const parsedAmount = parseFloat(editAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      alert('Please enter a valid amount.');
      return;
    }
    if (!editDescription.trim()) {
      alert('Please enter a description.');
      return;
    }

    const updated: Expense = {
      ...editingExpense,
      amount: parsedAmount,
      description: editDescription.trim(),
      category: editCategory,
      expenseDate: editDate,
      updatedAt: new Date().toISOString(),
    };

    try {
      await updateExpense(updated);
      setIsEditModalVisible(false);
      setEditingExpense(null);
      await refreshExpenses();
    } catch (e) {
      alert('Failed to update expense: ' + e);
    }
  };

  // Grouping logic helper
  const groupExpensesByDate = (list: Expense[]) => {
    const groups: Record<string, Expense[]> = {};
    list.forEach((item) => {
      const dateKey = item.expenseDate;
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(item);
    });

    return Object.keys(groups)
      .sort((a, b) => b.localeCompare(a))
      .map((dateKey) => {
        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        let displayDate = dateKey;
        if (dateKey === today) {
          displayDate = 'Today';
        } else if (dateKey === yesterdayStr) {
          displayDate = 'Yesterday';
        } else {
          try {
            const dateObj = new Date(dateKey + 'T00:00:00');
            displayDate = dateObj.toLocaleDateString(undefined, {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            });
          } catch (e) {
            displayDate = dateKey;
          }
        }

        return {
          dateLabel: displayDate,
          items: groups[dateKey],
        };
      });
  };

  const groupedData = groupExpensesByDate(expenses);

  return (
    <ThemedView style={styles.container}>
      {/* Search & Category Filtering Bar */}
      <View style={[styles.filterBar, { borderBottomColor: theme.border }]}>
        <View style={[styles.searchBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Ionicons name="search-outline" size={18} color={theme.textSecondary} />
          <TextInput
            placeholder="Search descriptions..."
            placeholderTextColor={theme.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={[styles.searchInput, { color: theme.text }]}
          />
          {searchQuery !== '' && (
            <Pressable onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={16} color={theme.textSecondary} />
            </Pressable>
          )}
        </View>

        {/* Categories Chips */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={styles.categoryScroll}
        >
          <Pressable
            onPress={() => setSelectedCategory(null)}
            style={[styles.filterChip, {
              backgroundColor: selectedCategory === null ? theme.primary : theme.card,
              borderColor: selectedCategory === null ? theme.primary : theme.border,
            }]}
          >
            <ThemedText style={{ 
              fontSize: 12, 
              color: selectedCategory === null ? '#fff' : theme.text,
              fontWeight: selectedCategory === null ? '700' : '500' 
            }}>
              All
            </ThemedText>
          </Pressable>
          
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <Pressable
                key={cat}
                onPress={() => setSelectedCategory(cat)}
                style={[styles.filterChip, {
                  backgroundColor: isSelected ? theme.primary : theme.card,
                  borderColor: isSelected ? theme.primary : theme.border,
                }]}
              >
                <ThemedText style={{ 
                  fontSize: 12, 
                  color: isSelected ? '#fff' : theme.text,
                  fontWeight: isSelected ? '700' : '500' 
                }}>
                  {cat}
                </ThemedText>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Transaction List */}
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {groupedData.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={48} color={theme.textSecondary} style={{ marginBottom: 12 }} />
            <ThemedText type="smallBold" themeColor="textSecondary">No transactions found</ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={{ textAlign: 'center', marginTop: 4 }}>
              Try entering a new expense or adjusting your filter constraints.
            </ThemedText>
          </View>
        ) : (
          groupedData.map((group) => (
            <View key={group.dateLabel} style={styles.groupContainer}>
              <ThemedText type="smallBold" themeColor="textSecondary" style={styles.groupHeader}>
                {group.dateLabel}
              </ThemedText>

              {group.items.map((item) => (
                <View 
                  key={item.id} 
                  style={[styles.transactionCard, { backgroundColor: theme.card, borderColor: theme.border }]}
                >
                  <View style={styles.itemMain}>
                    <ThemedText style={styles.itemTitle}>{item.description}</ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">{item.category}</ThemedText>
                  </View>

                  <View style={styles.itemRight}>
                    <ThemedText style={styles.itemAmount}>
                      {currency}{item.amount.toFixed(2)}
                    </ThemedText>
                    
                    <View style={styles.actions}>
                      <Pressable onPress={() => openEditModal(item)} style={styles.actionButton}>
                        <Ionicons name="pencil-outline" size={16} color={theme.textSecondary} />
                      </Pressable>
                      <Pressable onPress={() => handleDelete(item.id, item.description)} style={styles.actionButton}>
                        <Ionicons name="trash-outline" size={16} color={theme.danger} />
                      </Pressable>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          ))
        )}
      </ScrollView>

      {/* Edit Modal Dialog */}
      <Modal
        visible={isEditModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <ThemedView style={[styles.modalContent, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.modalHeader}>
              <ThemedText type="smallBold">Edit Transaction</ThemedText>
              <Pressable onPress={() => setIsEditModalVisible(false)}>
                <Ionicons name="close" size={24} color={theme.text} />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.modalForm} keyboardShouldPersistTaps="handled">
              
              <ThemedText style={styles.fieldLabel}>Amount ({currency})</ThemedText>
              <TextInput
                keyboardType="decimal-pad"
                value={editAmount}
                onChangeText={setEditAmount}
                style={[styles.modalInput, { color: theme.text, backgroundColor: theme.background, borderColor: theme.border }]}
              />

              <ThemedText style={styles.fieldLabel}>Description</ThemedText>
              <TextInput
                value={editDescription}
                onChangeText={setEditDescription}
                style={[styles.modalInput, { color: theme.text, backgroundColor: theme.background, borderColor: theme.border }]}
              />

              <ThemedText style={styles.fieldLabel}>Category</ThemedText>
              <View style={styles.categoryGrid}>
                {CATEGORIES.map((cat) => {
                  const isSelected = editCategory === cat;
                  return (
                    <Pressable
                      key={cat}
                      onPress={() => setEditCategory(cat)}
                      style={[styles.gridCell, {
                        borderColor: theme.border,
                        backgroundColor: isSelected ? theme.primaryLight : theme.background,
                      }]}
                    >
                      <ThemedText style={{ 
                        fontSize: 12, 
                        fontWeight: isSelected ? '700' : '500', 
                        color: isSelected ? theme.primary : theme.text 
                      }}>
                        {cat}
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </View>

              <ThemedText style={styles.fieldLabel}>Date</ThemedText>
              <TextInput
                placeholder="YYYY-MM-DD"
                placeholderTextColor={theme.textSecondary}
                value={editDate}
                onChangeText={setEditDate}
                style={[styles.modalInput, { color: theme.text, backgroundColor: theme.background, borderColor: theme.border }]}
              />

              <Pressable 
                onPress={handleSaveEdit}
                style={[styles.saveButton, { backgroundColor: theme.success }]}
              >
                <ThemedText style={{ color: '#fff', fontWeight: '700' }}>Save Changes</ThemedText>
              </Pressable>
            </ScrollView>
          </ThemedView>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filterBar: {
    padding: Spacing.three,
    borderBottomWidth: 1,
    gap: Spacing.two,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
    borderRadius: CornerRadius.medium,
    borderWidth: 1,
    paddingHorizontal: Spacing.two,
    gap: Spacing.one,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    height: '100%',
  },
  categoryScroll: {
    flexDirection: 'row',
    gap: Spacing.one,
    paddingVertical: 4,
  },
  filterChip: {
    paddingVertical: Spacing.one / 2,
    paddingHorizontal: Spacing.two,
    borderRadius: CornerRadius.round,
    borderWidth: 1,
    marginRight: 6,
  },
  scrollContent: {
    padding: Spacing.three,
    paddingBottom: Spacing.seven,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.six,
    paddingHorizontal: Spacing.four,
  },
  groupContainer: {
    marginBottom: Spacing.four,
  },
  groupHeader: {
    fontSize: 12,
    letterSpacing: 0.5,
    marginBottom: Spacing.one,
    paddingLeft: Spacing.one,
  },
  transactionCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.three,
    borderRadius: CornerRadius.medium,
    borderWidth: 1,
    marginBottom: Spacing.one,
  },
  itemMain: {
    flex: 1,
    paddingRight: Spacing.two,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  itemRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  itemAmount: {
    fontSize: 15,
    fontWeight: '700',
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.one,
  },
  actionButton: {
    padding: 2,
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
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.one / 2,
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
