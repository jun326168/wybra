import { ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { colors } from '@/lib/colors';
import { AppProvider } from '@/contexts/AppContext';

const customTheme = {
  dark: true,
  colors: {
    primary: colors.primary,
    background: colors.background,
    card: colors.card,
    text: colors.text,
    border: colors.border,
    notification: colors.primary,
  },
  fonts: {
    regular: {
      fontFamily: 'system',
      fontWeight: '400' as const,
    },
    medium: {
      fontFamily: 'system',
      fontWeight: '500' as const,
    },
    bold: {
      fontFamily: 'system',
      fontWeight: '700' as const,
    },
    heavy: {
      fontFamily: 'system',
      fontWeight: '900' as const,
    },
  },
};

export default function RootLayout() {
  return (
    <AppProvider>
      <ThemeProvider value={customTheme}>
        <Stack>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="setup" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen 
            name="profile-settings" 
            options={{ headerShown: false, presentation: 'modal', animation: 'slide_from_bottom' }} 
          />
          <Stack.Screen 
            name="preference-settings" 
            options={{ headerShown: false, presentation: 'modal', animation: 'slide_from_bottom' }} 
          />
        </Stack>
        <StatusBar style="light" />
      </ThemeProvider>
    </AppProvider>
  );
}
