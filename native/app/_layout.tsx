import { ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { useEffect } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import {
  Merriweather_400Regular,
  Merriweather_700Bold,
  Merriweather_400Regular_Italic,
  Merriweather_700Bold_Italic,
} from '@expo-google-fonts/merriweather';
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
  const [fontsLoaded, fontError] = useFonts({
    'Merriweather': Merriweather_400Regular,
    'Merriweather-Bold': Merriweather_700Bold,
    'Merriweather-Italic': Merriweather_400Regular_Italic,
    'Merriweather-Bold-Italic': Merriweather_700Bold_Italic,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

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
