import { Tabs } from 'expo-router';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme, View, ActivityIndicator } from 'react-native';
import { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';

import { Colors } from '@/constants/theme';
import { initDatabase } from '@/database/db';
import { useSettingsStore } from '@/stores/settingsStore';

SplashScreen.preventAutoHideAsync().catch((e) => {
  console.warn('[RootLayout] preventAutoHideAsync error:', e);
});

export default function RootLayout() {
  const systemColorScheme = useColorScheme();
  const { loadSettings, theme, isLoading } = useSettingsStore();
  const [dbReady, setDbReady] = useState(false);

  // Initialize SQLite database and load settings on startup
  useEffect(() => {
    async function startApp() {
      try {
        await initDatabase();
        await loadSettings();
        setDbReady(true);
      } catch (error) {
        console.error('[RootLayout] Critical startup failure:', error);
        // Fallback: still set dbReady true so the app does not freeze
        setDbReady(true);
      }
    }
    startApp();
  }, [loadSettings]);

  // Hide splash screen once database is ready and settings have loaded
  useEffect(() => {
    console.log('[RootLayout] Splash lifecycle status - isLoading:', isLoading, 'dbReady:', dbReady);
    if (!isLoading && dbReady) {
      console.log('[RootLayout] Hiding native splash screen...');
      SplashScreen.hideAsync()
        .then(() => console.log('[RootLayout] Native splash screen hidden successfully'))
        .catch((err) => {
          console.warn('[RootLayout] Failed to hide splash screen:', err);
        });
    }
  }, [isLoading, dbReady]);

  // Determine active theme based on user settings (light, dark, or system default)
  const activeScheme = theme === 'system' ? systemColorScheme : theme;
  const colors = Colors[activeScheme === 'dark' ? 'dark' : 'light'];

  const customLightTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      primary: colors.primary,
      background: colors.background,
      card: colors.card,
      border: colors.border,
      text: colors.text,
    },
  };

  const customDarkTheme = {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      primary: colors.primary,
      background: colors.background,
      card: colors.card,
      border: colors.border,
      text: colors.text,
    },
  };

  if (isLoading || !dbReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ThemeProvider value={activeScheme === 'dark' ? customDarkTheme : customLightTheme}>
      <Tabs
        screenOptions={{
          headerShown: true,
          headerStyle: {
            backgroundColor: colors.card,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
            elevation: 0,
            shadowOpacity: 0,
          },
          headerTitleStyle: {
            fontWeight: '600',
            fontSize: 18,
            color: colors.text,
          },
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textSecondary,
          tabBarStyle: {
            backgroundColor: colors.tabBarBackground,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            elevation: 8,
            height: 60,
            paddingBottom: 8,
            paddingTop: 8,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '500',
          },
        }}>
        
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            headerTitle: 'Dashboard',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'home' : 'home-outline'} size={22} color={color} />
            ),
          }}
        />
        
        <Tabs.Screen
          name="add"
          options={{
            title: 'Add',
            headerTitle: 'Add Expense',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'add-circle' : 'add-circle-outline'} size={24} color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="history"
          options={{
            title: 'History',
            headerTitle: 'Transactions',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'receipt' : 'receipt-outline'} size={22} color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="plan"
          options={{
            title: 'Plan',
            headerTitle: 'Money Plan',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'wallet' : 'wallet-outline'} size={22} color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="assistant"
          options={{
            title: 'Assistant',
            headerTitle: 'AI Money Assistant',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'chatbubble-ellipses' : 'chatbubble-ellipses-outline'} size={22} color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="settings"
          options={{
            title: 'Settings',
            headerTitle: 'Preferences & Privacy',
            href: null, // Hidden from bottom tabs
          }}
        />

      </Tabs>
    </ThemeProvider>
  );
}
