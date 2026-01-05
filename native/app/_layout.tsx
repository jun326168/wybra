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
import { PlayfairDisplay_400Regular, PlayfairDisplay_700Bold, PlayfairDisplay_400Regular_Italic, PlayfairDisplay_700Bold_Italic } from '@expo-google-fonts/playfair-display';
import { Nunito_400Regular, Nunito_700Bold } from '@expo-google-fonts/nunito';
import { NotoSerifJP_400Regular, NotoSerifJP_700Bold } from '@expo-google-fonts/noto-serif-jp';
import { MPLUSRounded1c_400Regular, MPLUSRounded1c_700Bold } from '@expo-google-fonts/m-plus-rounded-1c';
import { HachiMaruPop_400Regular } from '@expo-google-fonts/hachi-maru-pop';
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
    'Nunito': Nunito_400Regular,
    'Nunito-Bold': Nunito_700Bold,
    'PlayfairDisplay': PlayfairDisplay_400Regular,
    'PlayfairDisplay-Bold': PlayfairDisplay_700Bold,
    'PlayfairDisplay-Italic': PlayfairDisplay_400Regular_Italic,
    'PlayfairDisplay-Bold-Italic': PlayfairDisplay_700Bold_Italic,
    'NotoSerifJP': NotoSerifJP_400Regular,
    'NotoSerifJP-Bold': NotoSerifJP_700Bold,
    'MPLUSRounded1c': MPLUSRounded1c_400Regular,
    'MPLUSRounded1c-Bold': MPLUSRounded1c_700Bold,
    'HachiMaruPop': HachiMaruPop_400Regular,
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
          <Stack.Screen name="profile-settings" options={{ headerShown: false, presentation: 'modal', animation: 'slide_from_bottom' }} />
          <Stack.Screen name="preference-settings" options={{ headerShown: false, presentation: 'modal', animation: 'slide_from_bottom' }} />
        </Stack>
        <StatusBar style="light" />
      </ThemeProvider>
    </AppProvider>
  );
}
