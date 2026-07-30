import { StyleSheet, View, ScrollView, TextInput, Pressable, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing, CornerRadius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useSettingsStore } from '@/stores/settingsStore';
import { wipeDatabase } from '@/database/db';

export default function SettingsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const {
    currency,
    monthlyIncome,
    monthlySavingsGoal,
    theme: activeTheme,
    setCurrency,
    setMonthlyIncome,
    setMonthlySavingsGoal,
    setOnboardingCompleted,
    setTheme,
    resetAllSettings,
  } = useSettingsStore();

  const handleWipeData = () => {
    // Platform-compatible double verification check
    Alert.alert(
      'Delete All Data?',
      'This will physically wipe all local database transactions, settings, budgets, and savings goals from your device. This operation is irreversible.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Wipe Everything', 
          style: 'destructive',
          onPress: async () => {
            try {
              await wipeDatabase();
              resetAllSettings();
              alert('All local data has been successfully deleted.');
              router.replace('/');
            } catch (error) {
              alert('Failed to erase data: ' + error);
            }
          }
        }
      ]
    );
  };

  const handleCompleteOnboarding = async () => {
    await setOnboardingCompleted(true);
    alert('Onboarding preferences updated successfully!');
    router.replace('/');
  };

  const CURRENCY_OPTIONS = ['$', '€', '£', '¥', '₹'];

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Onboarding Settings */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionHeader}>
            ONBOARDING BUDGET PREFERENCES
          </ThemedText>

          {/* Currency */}
          <ThemedText style={styles.fieldLabel}>Preferred Currency</ThemedText>
          <View style={styles.currencyRow}>
            {CURRENCY_OPTIONS.map((curr) => (
              <Pressable
                key={curr}
                onPress={async () => { await setCurrency(curr); }}
                style={[styles.currencyButton, {
                  borderColor: theme.border,
                  backgroundColor: currency === curr ? theme.primaryLight : theme.background,
                }]}
              >
                <ThemedText style={{ 
                  fontWeight: currency === curr ? '700' : '500', 
                  color: currency === curr ? theme.primary : theme.text 
                }}>
                  {curr}
                </ThemedText>
              </Pressable>
            ))}
          </View>

          {/* Monthly Income */}
          <ThemedText style={styles.fieldLabel}>Approximate Monthly Income</ThemedText>
          <TextInput
            placeholder="0.00 (Optional)"
            placeholderTextColor={theme.textSecondary}
            keyboardType="decimal-pad"
            value={monthlyIncome > 0 ? monthlyIncome.toString() : ''}
            onChangeText={(val) => setMonthlyIncome(parseFloat(val) || 0)}
            style={[styles.input, { color: theme.text, backgroundColor: theme.background, borderColor: theme.border }]}
          />

          {/* Savings Goal */}
          <ThemedText style={styles.fieldLabel}>Monthly Savings Goal</ThemedText>
          <TextInput
            placeholder="0.00 (Optional)"
            placeholderTextColor={theme.textSecondary}
            keyboardType="decimal-pad"
            value={monthlySavingsGoal > 0 ? monthlySavingsGoal.toString() : ''}
            onChangeText={(val) => setMonthlySavingsGoal(parseFloat(val) || 0)}
            style={[styles.input, { color: theme.text, backgroundColor: theme.background, borderColor: theme.border }]}
          />

          <Pressable 
            onPress={handleCompleteOnboarding}
            style={[styles.saveButton, { backgroundColor: theme.primary }]}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Save onboarding preferences"
          >
            <ThemedText style={{ color: '#fff', fontWeight: '700' }}>Save & Apply</ThemedText>
          </Pressable>
        </View>

        {/* Display / Theme Preferences */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionHeader}>
            DISPLAY THEME
          </ThemedText>
          
          <View style={styles.themeRow}>
            {(['light', 'dark', 'system'] as const).map((t) => (
              <Pressable
                key={t}
                onPress={async () => { await setTheme(t); }}
                style={[styles.themeOptionButton, {
                  borderColor: theme.border,
                  backgroundColor: activeTheme === t ? theme.primaryLight : theme.background,
                }]}
              >
                <ThemedText style={{ 
                  textTransform: 'capitalize',
                  fontWeight: activeTheme === t ? '700' : '500', 
                  color: activeTheme === t ? theme.primary : theme.text 
                }}>
                  {t}
                </ThemedText>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Privacy & Wipe Control */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionHeader}>
            PRIVACY & DATA CONTROLS
          </ThemedText>
          <ThemedText style={styles.privacyBody} type="small" themeColor="textSecondary">
            All details inputted into this app are stored locally in an encrypted sandbox on your device database. AI insights are generated only on aggregate metrics. No raw transaction logs are sent.
          </ThemedText>

          <Pressable 
            onPress={handleWipeData}
            style={[styles.wipeButton, { borderColor: theme.danger }]}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Delete all local user data and reset the database"
          >
            <Ionicons name="trash-bin-outline" size={16} color={theme.danger} />
            <ThemedText style={{ color: theme.danger, fontWeight: '700' }}>
              Delete All Local Data
            </ThemedText>
          </Pressable>
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
  fieldLabel: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: Spacing.two,
    marginBottom: Spacing.one,
  },
  input: {
    height: 44,
    borderRadius: CornerRadius.medium,
    borderWidth: 1,
    paddingHorizontal: Spacing.two,
    fontSize: 15,
    marginBottom: Spacing.one,
  },
  currencyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.two,
  },
  currencyButton: {
    flex: 1,
    height: 40,
    borderRadius: CornerRadius.medium,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 3,
  },
  saveButton: {
    height: 48,
    borderRadius: CornerRadius.medium,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.three,
  },
  themeRow: {
    flexDirection: 'row',
    gap: Spacing.one,
  },
  themeOptionButton: {
    flex: 1,
    height: 40,
    borderRadius: CornerRadius.medium,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  privacyBody: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: Spacing.three,
  },
  wipeButton: {
    height: 44,
    borderRadius: CornerRadius.medium,
    borderWidth: 1.5,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.one,
  },
});
